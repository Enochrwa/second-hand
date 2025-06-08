// Example: src/pages/SearchResultsPage.jsx
import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import itemService from "../services/itemService";
import ItemGrid from "../components/items/ItemGrid";
import LoadingSpinner from "../components/common/LoadingSpinner";
import ErrorMessage from "../components/common/ErrorMessage";

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSearchResults = async () => {
      try {
        setLoading(true);
        // Convert searchParams to an object for the service
        const params = Object.fromEntries(searchParams.entries());
        const response = await itemService.getItems(params); // Changed searchItems to getItems
        setItems(response.data.data);
        setError("");
      } catch (err) {
        console.error("Error fetching search results:", err);
        setError("Failed to load search results. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [searchParams]); // Re-run effect when search params change

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Search Results</h1>
      {/* You might want to display the active filters here */}
      <ItemGrid items={items} loading={loading} error={error} />
    </div>
  );
};

export default SearchResultsPage;
