// SearchFilters.jsx
import React, { useState } from 'react';
import { useForm } from '../../hooks/useForm';
import { ITEM_CATEGORIES, ITEM_CONDITIONS } from '../../utils/constants';

const SearchFilters = ({ onSearch }) => {
  const { values, handleChange, resetForm } = useForm({ // Added resetForm
    query: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    condition: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Filter out empty values
    const filters = Object.entries(values).reduce((acc, [key, value]) => {
      if (value) {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    onSearch(filters);
  };

  const handleReset = () => {
    // Reset form and trigger search with empty filters
    resetForm(); // Use resetForm from useForm hook
    onSearch({});
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4">Search & Filter</h3>
      
      <form id="search-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="query" className="form-label">Search</label>
          <input
            type="text"
            id="query"
            name="query"
            value={values.query}
            onChange={handleChange}
            className="form-input"
            placeholder="Search by keywords..."
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="category" className="form-label">Category</label>
            <select
              id="category"
              name="category"
              value={values.category}
              onChange={handleChange}
              className="form-input"
            >
              <option value="">All Categories</option>
              {ITEM_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="condition" className="form-label">Condition</label>
            <select
              id="condition"
              name="condition"
              value={values.condition}
              onChange={handleChange}
              className="form-input"
            >
              <option value="">Any Condition</option>
              {ITEM_CONDITIONS.map((condition) => (
                <option key={condition} value={condition}>
                  {condition.charAt(0).toUpperCase() + condition.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="minPrice" className="form-label">Min Price ($)</label>
            <input
              type="number"
              id="minPrice"
              name="minPrice"
              value={values.minPrice}
              onChange={handleChange}
              min="0"
              className="form-input"
              placeholder="Min"
            />
          </div>
          
          <div>
            <label htmlFor="maxPrice" className="form-label">Max Price ($)</label>
            <input
              type="number"
              id="maxPrice"
              name="maxPrice"
              value={values.maxPrice}
              onChange={handleChange}
              min="0"
              className="form-input"
              placeholder="Max"
            />
          </div>
        </div>
        
        <div className="flex justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="btn btn-outline"
          >
            Reset
          </button>
          <button
            type="submit"
            className="btn btn-primary"
          >
            Apply Filters
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchFilters;
