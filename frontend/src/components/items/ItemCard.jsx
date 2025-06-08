// ItemCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { formatPrice, formatDate, truncateText } from '../../utils/formatters';
import { ITEM_STATUS } from '../../utils/constants';

const DEFAULT_ITEM_IMAGE = "/assets/default-item.png";

const ItemCard = ({ item }) => {
  const { _id, title, description, price, photos, status, category, condition, createdAt } = item;
  
  const statusBadgeClass = status === ITEM_STATUS.AVAILABLE 
    ? 'badge-success' 
    : 'badge-danger';
  
  const statusText = status === ITEM_STATUS.AVAILABLE ? 'Available' : 'Sold';

  const handleImageError = (event) => {
    event.target.src = DEFAULT_ITEM_IMAGE;
  };
  
  return (
    <div className="card h-full flex flex-col">
      <div className="relative h-48">
        <img
          src={
            photos && photos.length > 0
              ? `/uploads/items/${photos[0]}`
              : DEFAULT_ITEM_IMAGE
          }
          alt={title}
          className="w-full h-full object-cover"
          onError={handleImageError} // Added onError handler
        />
        <span className={`absolute top-2 right-2 badge ${statusBadgeClass}`}>
          {statusText}
        </span>
        <span className="absolute top-2 left-2 badge badge-info">
          {category}
        </span>
      </div>

      <div className="p-4 flex-grow flex flex-col">
        <h3 className="text-lg font-semibold mb-1">
          <Link to={`/items/${_id}`} className="hover:text-primary">
            {title}
          </Link>
        </h3>

        <p className="text-gray-600 text-sm mb-2">
          Condition: <span className="font-medium">{condition}</span>
        </p>

        <p className="text-gray-700 mb-4 flex-grow">
          {truncateText(description, 100)}
        </p>

        <div className="flex justify-between items-center mt-auto">
          <span className="text-lg font-bold text-primary">
            {formatPrice(price)}
          </span>
          <span className="text-xs text-gray-500">{formatDate(createdAt)}</span>
        </div>
      </div>

      <div className="p-4 pt-0">
        <Link to={`/items/${_id}`} className="btn btn-primary w-full">
          View Details
        </Link>
      </div>
    </div>
  );
};

export default ItemCard;
