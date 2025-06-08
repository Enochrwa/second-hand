const ExcelJS = require('exceljs');
const path = require('path');
const asyncHandler = require('../middleware/async');
const ErrorResponse = require('../utils/errorResponse');
const Item = require('../models/Item');
const Report = require('../models/Report'); // Added Report model

// @desc    Generate Excel report of items (sold and available)
// @route   GET /api/admin/reports/items-inventory
// @access  Private/Admin
exports.generateItemsInventoryReport = asyncHandler(async (req, res, next) => {
  // Create a new workbook and add a worksheet
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'INES-Market Admin';
  workbook.created = new Date();
  
  // Add worksheets for available and sold items
  const availableItemsSheet = workbook.addWorksheet('Available Items');
  const soldItemsSheet = workbook.addWorksheet('Sold Items');
  
  // Define columns for both worksheets
  const columns = [
    { header: 'ID', key: 'id', width: 28 },
    { header: 'Title', key: 'title', width: 30 },
    { header: 'Category', key: 'category', width: 15 },
    { header: 'Condition', key: 'condition', width: 15 },
    { header: 'Price ($)', key: 'price', width: 12 },
    { header: 'Seller', key: 'seller', width: 25 },
    { header: 'Date Posted', key: 'datePosted', width: 20 }
  ];
  
  availableItemsSheet.columns = columns;
  soldItemsSheet.columns = columns;
  
  // Style the header row
  const headerStyle = {
    font: { bold: true, color: { argb: 'FFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F81BD' } },
    border: {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  };
  
  availableItemsSheet.getRow(1).eachCell(cell => {
    cell.style = headerStyle;
  });
  
  soldItemsSheet.getRow(1).eachCell(cell => {
    cell.style = headerStyle;
  });
  
  // Fetch available items
  const availableItems = await Item.find({ status: 'available', approved: true })
    .populate('userId', 'firstName lastName');
  
  // Fetch sold items
  const soldItems = await Item.find({ status: 'sold', approved: true })
    .populate('userId', 'firstName lastName');
  
  // Add available items to the worksheet
  availableItems.forEach(item => {
    availableItemsSheet.addRow({
      id: item._id.toString(),
      title: item.title,
      category: item.category,
      condition: item.condition,
      price: item.price,
      seller: item.userId ? `${item.userId.firstName} ${item.userId.lastName}` : 'Unknown',
      datePosted: new Date(item.createdAt).toLocaleDateString()
    });
  });
  
  // Add sold items to the worksheet
  soldItems.forEach(item => {
    soldItemsSheet.addRow({
      id: item._id.toString(),
      title: item.title,
      category: item.category,
      condition: item.condition,
      price: item.price,
      seller: item.userId ? `${item.userId.firstName} ${item.userId.lastName}` : 'Unknown',
      datePosted: new Date(item.createdAt).toLocaleDateString()
    });
  });
  
  // Add totals row for each sheet
  const availableTotalRow = availableItemsSheet.addRow({
    title: 'TOTAL',
    price: availableItems.reduce((sum, item) => sum + item.price, 0)
  });
  
  const soldTotalRow = soldItemsSheet.addRow({
    title: 'TOTAL',
    price: soldItems.reduce((sum, item) => sum + item.price, 0)
  });
  
  // Style the totals row
  const totalStyle = {
    font: { bold: true },
    border: {
      top: { style: 'thin' },
      bottom: { style: 'double' }
    }
  };
  
  availableTotalRow.eachCell(cell => {
    cell.style = totalStyle;
  });
  
  soldTotalRow.eachCell(cell => {
    cell.style = totalStyle;
  });
  
  // Set filename and headers
  const filename = `items-inventory-${Date.now()}.xlsx`;
  
  // Set content type and disposition
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  
  // Write to response
  await workbook.xlsx.write(res);
  
  // End the response
  res.end();
});

// @desc    Get all reports
// @route   GET /api/admin/reports
// @access  Private/Admin
exports.getReports = asyncHandler(async (req, res, next) => {
  const reports = await Report.find()
    .populate('reporterId', 'firstName lastName')
    .populate('itemId', 'title')
    .populate('userId', 'firstName lastName');

  res.status(200).json({
    success: true,
    count: reports.length,
    data: reports
  });
});

// @desc    Get single report by ID
// @route   GET /api/admin/reports/:id
// @access  Private/Admin
exports.getReportById = asyncHandler(async (req, res, next) => {
  const report = await Report.findById(req.params.id)
    .populate('reporterId', 'firstName lastName email')
    .populate('itemId', 'title description category')
    .populate('userId', 'firstName lastName email'); // Assuming this is the reported user

  if (!report) {
    return next(
      new ErrorResponse(`Report not found with id of ${req.params.id}`, 404)
    );
  }

  res.status(200).json({
    success: true,
    data: report
  });
});

// @desc    Update a report status
// @route   PUT /api/admin/reports/:id
// @access  Private/Admin
exports.updateReport = asyncHandler(async (req, res, next) => {
  const { status } = req.body;

  if (!status) {
    return next(new ErrorResponse('Please provide a status', 400));
  }

  // Check if status is valid
  const validStatuses = ['pending', 'resolved', 'dismissed'];
  if (!validStatuses.includes(status)) {
    return next(new ErrorResponse(`Invalid status: ${status}. Must be one of ${validStatuses.join(', ')}`, 400));
  }

  let report = await Report.findById(req.params.id);

  if (!report) {
    return next(
      new ErrorResponse(`Report not found with id of ${req.params.id}`, 404)
    );
  }

  report.status = status;
  report.updatedAt = Date.now(); // Manually update updatedAt if not automatically handled by schema
  await report.save();

  res.status(200).json({
    success: true,
    data: report
  });
});

// @desc    Generate Excel report of items by category
// @route   GET /api/admin/reports/items-by-category
// @access  Private/Admin
exports.generateItemsByCategoryReport = asyncHandler(async (req, res, next) => {
  // Create a new workbook and add a worksheet
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'INES-Market Admin';
  workbook.created = new Date();
  
  const worksheet = workbook.addWorksheet('Items by Category');
  
  // Define columns
  worksheet.columns = [
    { header: 'Category', key: 'category', width: 15 },
    { header: 'Available Items', key: 'availableCount', width: 15 },
    { header: 'Sold Items', key: 'soldCount', width: 15 },
    { header: 'Total Items', key: 'totalCount', width: 15 },
    { header: 'Available Value ($)', key: 'availableValue', width: 20 },
    { header: 'Sold Value ($)', key: 'soldValue', width: 20 },
    { header: 'Total Value ($)', key: 'totalValue', width: 20 }
  ];
  
  // Style the header row
  const headerStyle = {
    font: { bold: true, color: { argb: 'FFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F81BD' } },
    border: {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  };
  
  worksheet.getRow(1).eachCell(cell => {
    cell.style = headerStyle;
  });
  
  // Get all categories
  const categories = ['books', 'electronics', 'furniture', 'clothing', 'other'];
  
  // Initialize totals
  let totalAvailableCount = 0;
  let totalSoldCount = 0;
  let totalAvailableValue = 0;
  let totalSoldValue = 0;
  
  // Process each category
  for (const category of categories) {
    // Count and sum available items
    const availableItems = await Item.find({ 
      category, 
      status: 'available',
      approved: true
    });
    
    const availableCount = availableItems.length;
    const availableValue = availableItems.reduce((sum, item) => sum + item.price, 0);
    
    // Count and sum sold items
    const soldItems = await Item.find({ 
      category, 
      status: 'sold',
      approved: true
    });
    
    const soldCount = soldItems.length;
    const soldValue = soldItems.reduce((sum, item) => sum + item.price, 0);
    
    // Add to totals
    totalAvailableCount += availableCount;
    totalSoldCount += soldCount;
    totalAvailableValue += availableValue;
    totalSoldValue += soldValue;
    
    // Add row to worksheet
    worksheet.addRow({
      category: category.charAt(0).toUpperCase() + category.slice(1),
      availableCount,
      soldCount,
      totalCount: availableCount + soldCount,
      availableValue,
      soldValue,
      totalValue: availableValue + soldValue
    });
  }
  
  // Add totals row
  const totalRow = worksheet.addRow({
    category: 'TOTAL',
    availableCount: totalAvailableCount,
    soldCount: totalSoldCount,
    totalCount: totalAvailableCount + totalSoldCount,
    availableValue: totalAvailableValue,
    soldValue: totalSoldValue,
    totalValue: totalAvailableValue + totalSoldValue
  });
  
  // Style the totals row
  const totalStyle = {
    font: { bold: true },
    border: {
      top: { style: 'thin' },
      bottom: { style: 'double' }
    }
  };
  
  totalRow.eachCell(cell => {
    cell.style = totalStyle;
  });
  
  // Set filename and headers
  const filename = `items-by-category-${Date.now()}.xlsx`;
  
  // Set content type and disposition
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  
  // Write to response
  await workbook.xlsx.write(res);
  
  // End the response
  res.end();
});
