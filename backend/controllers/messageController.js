const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const User = require('../models/User');

// @desc    Get user conversations
// @route   GET /api/conversations
// @access  Private
exports.getConversations = asyncHandler(async (req, res, next) => {
  const conversations = await Conversation.find({
    participants: { $in: [req.user.id] }
  }).populate({
    path: 'participants',
    select: 'firstName lastName profilePhoto email' // Added email for participants
  }).populate({
    path: 'itemId',
    select: 'title photos category' // Added category for item
  }).populate({
    path: 'lastMessage',
    select: 'content senderId createdAt readBy', // Select fields for lastMessage
    populate: { // Nested populate for senderId within lastMessage
      path: 'senderId',
      select: 'firstName lastName _id'
    }
  }).sort({ updatedAt: -1 });

  // Calculate unreadCount for each conversation
  const conversationsWithUnreadCount = await Promise.all(
    conversations.map(async (conv) => {
      const unreadCount = await Message.countDocuments({
        conversationId: conv._id,
        senderId: { $ne: req.user.id },
        readBy: { $nin: [req.user.id] }
      });
      // Convert Mongoose document to plain JS object to add new property
      const convObject = conv.toObject(); 
      convObject.unreadCount = unreadCount;
      return convObject;
    })
  );

  res.status(200).json({
    success: true,
    count: conversationsWithUnreadCount.length,
    data: conversationsWithUnreadCount
  });
});

// @desc    Get conversation by ID
// @route   GET /api/conversations/:id
// @access  Private
exports.getConversation = asyncHandler(async (req, res, next) => {
  const conversation = await Conversation.findById(req.params.id)
    .populate({
      path: 'participants',
      select: 'firstName lastName profilePhoto'
    })
    .populate({
      path: 'itemId',
      select: 'title photos'
    });

  if (!conversation) {
    return next(new ErrorResponse(`Conversation not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is part of the conversation
  if (!conversation.participants.some(p => p._id.toString() === req.user.id)) {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to access this conversation`, 401));
  }

  res.status(200).json({
    success: true,
    data: conversation
  });
});

// @desc    Create new conversation
// @route   POST /api/conversations
// @access  Private
exports.createConversation = asyncHandler(async (req, res, next) => {
  const { receiverId, itemId, initialMessage } = req.body;

  if (!receiverId || !initialMessage) {
    return next(new ErrorResponse('Please provide a receiver and initial message', 400));
  }

  // Check if receiver exists
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    return next(new ErrorResponse(`User not found with id of ${receiverId}`, 404));
  }

  // Check if conversation already exists between these users about this item
  let conversation = await Conversation.findOne({
    participants: { $all: [req.user.id, receiverId] },
    itemId: itemId || null // Use null for $exists: false equivalent if itemId is not provided
  });

  let isNewConversation = false;
  if (!conversation) {
    conversation = new Conversation({ // Use 'new' to create an instance, save later
      participants: [req.user.id, receiverId],
      itemId: itemId || undefined
      // lastMessage will be set after the message is created
    });
    isNewConversation = true; // Flag to indicate if we need to save a new conversation
  }

  // Create the initial message
  const message = await Message.create({
    conversationId: conversation._id, // This will be assigned even if conversation is new (Mongoose assigns _id pre-save)
    senderId: req.user.id,
    content: initialMessage,
    readBy: [req.user.id] // Mark as read by sender
  });

  // Set the lastMessage for the conversation
  conversation.lastMessage = message._id;
  
  // If it's a new conversation, its _id might not be set before saving the message if not handled carefully.
  // Let's ensure conversation is saved first if new, then message, then update conversation.
  // Correction: A conversation needs an _id for the message's conversationId.
  // So, if new, save conversation first (without lastMessage). Then create message. Then update conversation.

  if (isNewConversation) {
    // If it's a brand new conversation, save it to get its _id
    // We can remove lastMessage before this save if we are certain, but Mongoose might handle it.
    // To be safe, let's re-create the message if conversation was new and its _id was not available.
    // This part is tricky. Let's simplify:
    // 1. Find or initialize conversation.
    // 2. If new, save it to get _id.
    // 3. Create message with conversation._id.
    // 4. Update conversation.lastMessage and save.

    // Revised flow for createConversation:
    // Step 1: Find existing conversation or prepare a new one.
    // (already done above with `conversation` and `isNewConversation`)
    
    if (isNewConversation) {
        await conversation.save(); // Save the new conversation to get its _id
    }
    
    // Step 2: Create the message, now that we are sure conversation._id is available.
    // The message created earlier might have a null conversationId if conversation was new and not saved.
    // So, it's better to create the message *after* ensuring the conversation exists in DB or has an ID.
    // Let's re-create the message object if it was a new conversation to ensure conversationId is set.
    // No, Mongoose assigns an _id to a new document even before it's saved. So message.conversationId should be fine.
  }
  
  // The message is already created with conversation._id.
  // Now, link the message to the conversation and save the conversation.
  conversation.lastMessage = message._id;
  await conversation.save(); // Saves new conversation or updates existing one with lastMessage and new updatedAt.

  // Refetch conversation to populate necessary fields for the response
  const populatedConversation = await Conversation.findById(conversation._id)
    .populate({ path: 'participants', select: 'firstName lastName profilePhoto' })
    .populate({ path: 'itemId', select: 'title photos' })
    .populate({ path: 'lastMessage', populate: { path: 'senderId', select: 'firstName lastName' } });


  res.status(201).json({
    success: true,
    data: {
      conversation: populatedConversation, // Send populated conversation
      message
    }
  });
});

// @desc    Get messages by conversation
// @route   GET /api/messages/conversation/:conversationId
// @access  Private
exports.getMessagesByConversation = asyncHandler(async (req, res, next) => {
  const conversation = await Conversation.findById(req.params.conversationId);

  if (!conversation) {
    return next(new ErrorResponse(`Conversation not found with id of ${req.params.conversationId}`, 404));
  }

  // Make sure user is part of the conversation
  if (!conversation.participants.includes(req.user.id)) {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to access messages in this conversation`, 401));
  }

  const messages = await Message.find({ conversationId: req.params.conversationId })
    .sort({ createdAt: 1 });

  // Mark messages as read if user is not the sender
  await Message.updateMany(
    { 
      conversationId: req.params.conversationId,
      senderId: { $ne: req.user.id },
      read: false
    },
    { read: true }
  );

  res.status(200).json({
    success: true,
    count: messages.length,
    data: messages
  });
});

// @desc    Mark messages in a conversation as read
// @route   POST /api/conversations/:conversationId/read
// @access  Private
exports.markMessagesAsRead = asyncHandler(async (req, res, next) => {
  const { conversationId } = req.params;
  const userId = req.user.id;

  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    return next(new ErrorResponse(`Conversation not found with id of ${conversationId}`, 404));
  }

  // Ensure user is part of the conversation
  if (!conversation.participants.map(p => p.toString()).includes(userId)) {
    return next(new ErrorResponse(`User ${userId} is not authorized to mark messages as read in this conversation`, 403));
  }

  // Update messages: add userId to readBy array for messages not sent by userId
  // and where userId is not already in readBy.
  const result = await Message.updateMany(
    {
      conversationId: conversationId,
      senderId: { $ne: userId }, // Message not sent by the current user
      readBy: { $nin: [userId] } // Current user has not read it yet
    },
    {
      $addToSet: { readBy: userId } // Add user to readBy array (ensures no duplicates)
    }
  );

  res.status(200).json({
    success: true,
    message: `${result.nModified} messages marked as read.`, // nModified is not standard, using modifiedCount
    modifiedCount: result.modifiedCount 
  });
});


// @desc    Send a message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = asyncHandler(async (req, res, next) => {
  const { conversationId, content } = req.body;

  if (!conversationId || !content) {
    return next(new ErrorResponse('Please provide conversation ID and message content', 400));
  }

  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    return next(new ErrorResponse(`Conversation not found with id of ${conversationId}`, 404));
  }

  // Make sure user is part of the conversation
  if (!conversation.participants.includes(req.user.id)) {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to send messages in this conversation`, 401));
  }

  // Create message
  const message = await Message.create({
    conversationId,
    senderId: req.user.id,
    content,
    readBy: [req.user.id] // Mark as read by sender
  });

  // Update conversation with last message
  conversation.lastMessage = message._id;
  await conversation.save(); // This will also update the 'updatedAt' timestamp

  res.status(201).json({
    success: true,
    data: message
  });
});
