import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import './App.css';

const API_URL = 'http://localhost:5001/api/payments';

const getPspClass = (pspName) => {
  const name = pspName?.toLowerCase().replace(/\s+/g, '') || 'default';
  return `psp-${name}`;
};
const getSchemeClass = (schemeName) => {
    const name = schemeName?.toLowerCase() || 'default';
    return `scheme-${name}`;
}

function App() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [apiSearchTerm, setApiSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [facets, setFacets] = useState({});
  const [selectedFacets, setSelectedFacets] = useState({
    psp: [], scheme: [], status: [], type: [], country: []
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const itemsPerPage = 10;

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm.length === 0 || searchTerm.length >= 3) {
        setApiSearchTerm(searchTerm);
      } else if (apiSearchTerm !== '' && searchTerm.length < 3 && searchTerm.length > 0) {
        setApiSearchTerm('');
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, apiSearchTerm]);

  const fetchData = useCallback(async () => {
    const shouldFetchBasedOnSearch = apiSearchTerm.length === 0 || apiSearchTerm.length >= 3;
    const hasSelectedFacets = Object.values(selectedFacets).some(facetArray => facetArray.length > 0);

    if (!shouldFetchBasedOnSearch && !hasSelectedFacets && apiSearchTerm.length > 0) {
      console.log("Search term too short and no facets, clearing results and not fetching:", apiSearchTerm);
      setPayments([]);
      setTotalPages(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    console.log("Fetching data with:", { page: currentPage, q: apiSearchTerm, facets: selectedFacets });
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });
      if (apiSearchTerm) {
        params.append('q', apiSearchTerm);
      }
      Object.entries(selectedFacets).forEach(([facetKey, values]) => {
        values.forEach(value => params.append(facetKey, value));
      });

      const response = await axios.get(`${API_URL}?${params.toString()}`);
      console.log("API Response:", response.data);
      setPayments(response.data.payments || []);
      setTotalPages(response.data.totalPages || 0);
      setFacets(response.data.facets || {});
    } catch (error) {
      console.error("Error fetching payments:", error);
      setPayments([]); setTotalPages(0); setFacets({});
    } finally {
      setLoading(false);
    }
  }, [currentPage, apiSearchTerm, selectedFacets, itemsPerPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearchInputChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
    }
  };

  const handleFacetChange = (facetType, value) => {
    setSelectedFacets(prev => {
      const currentValues = prev[facetType] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [facetType]: newValues };
    });
    setCurrentPage(1);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="pagination">
        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0}>
          Next
        </button>
      </div>
    );
  };

  const renderFacetGroup = (title, facetKey, facetData) => {
    if (!facetData || !facetData.buckets || facetData.buckets.length === 0) {
      return null;
    }
    return (
      <div className="facet-group">
        <h4>{title}</h4>
        {facetData.buckets.map(bucket => (
          <div
            key={bucket._id}
            className={`facet-item ${selectedFacets[facetKey]?.includes(bucket._id) ? 'selected' : ''}`}
            onClick={() => handleFacetChange(facetKey, bucket._id)}
          >
            <input
                type="checkbox"
                checked={selectedFacets[facetKey]?.includes(bucket._id)}
                readOnly
            />
            <span className="facet-name">{bucket._id}</span>
            <span className="count">{bucket.count}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`app-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
            <h1>Links Portal</h1>
            <button
              onClick={toggleSidebar}
              className="sidebar-toggle-btn internal-toggle"
              aria-label="Close sidebar"
              aria-expanded={isSidebarOpen} // This button is only visible when sidebar is open
            >
              ✕
            </button>
        </div>
        <ul>
          <li>Home</li>
          <li>Routing</li>
          <li className="active">Payments</li>
          <li>Actions</li>
          <li>Reconciliations</li>
          <li>Reports</li>
          <li>Settlements</li>
          <li>Pay by Link</li>
          <li>Audit trail</li>
          <li>Users</li>
          <li>Merchants</li>
          <li>PSP accounts</li>
        </ul>
      </aside>

      <main className={`main-content ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="main-content-header-bar">
          {!isSidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="sidebar-toggle-btn external-toggle"
              aria-label="Open sidebar"
              aria-expanded={isSidebarOpen} // This button is only visible when sidebar is closed
            >
              ☰
            </button>
          )}
          <div className="header"> {/* Original header content */}
            <h2>Payments</h2>
            <div className="date-range-display">19 May 2025 17:07 - 26 May 2025 17:07 Timezone +07:00</div>
          </div>
        </div>

        <div className="search-bar-container">
            <input
                type="text"
                placeholder="Search (min 3 chars)..."
                className="search-input"
                value={searchTerm}
                onChange={handleSearchInputChange}
            />
        </div>

        <div className="content-area">
            <div className="facets-container" style={{minWidth: '220px'}}>
                <h3>Filters</h3>
                { (facets && Object.keys(facets).length > 0) ? (
                    <>
                        {renderFacetGroup("PSP", "psp", facets.pspFacet)}
                        {renderFacetGroup("Scheme", "scheme", facets.schemeFacet)}
                        {renderFacetGroup("Status", "status", facets.statusFacet)}
                        {renderFacetGroup("Type", "type", facets.typeFacet)}
                        {renderFacetGroup("Country", "country", facets.countryFacet)}
                    </>
                ) : loading ? (
                    <p>Loading filters...</p>
                ) : (
                    <p>No filter options available.</p>
                )}
            </div>

            <div className="table-container">
                {loading ? (
                <p>Loading payments...</p>
                ) : payments.length === 0 ? (
                <p className="no-results">No payments found matching your criteria.</p>
                ) : (
                <table>
                    <thead>
                    <tr>
                        <th>GrabLink ID</th>
                        <th>PSP</th>
                        <th>Transaction date</th>
                        <th>Scheme</th>
                        <th>Amount</th>
                        <th>GL response</th>
                        <th>BIN</th>
                        <th>Last 4</th>
                        <th>Email</th>
                        <th>Merchant</th>
                    </tr>
                    </thead>
                    <tbody>
                    {payments.map((payment) => (
                        <tr key={payment.grabLinkID || payment._id}>
                        <td>{payment.grabLinkID}</td>
                        <td>
                            <span className={`psp-badge ${getPspClass(payment.psp)}`}>
                            {payment.psp}
                            </span>
                        </td>
                        <td>
                            {payment.transactionDate
                            ? format(new Date(payment.transactionDate.$date || payment.transactionDate), 'dd MMM yyyy HH:mm:ss')
                            : 'N/A'}
                        </td>
                        <td>
                            <span className={`scheme-icon ${getSchemeClass(payment.scheme)}`}>
                                {payment.scheme?.toUpperCase()}
                            </span>
                        </td>
                        <td>{payment.amount?.currency} {payment.amount?.value?.toFixed(2)}</td>
                        <td>{payment.glResponse?.status}</td>
                        <td>{payment.bin}</td>
                        <td>{payment.last4}</td>
                        <td>{payment.customerEmail}</td>
                        <td>{payment.merchantName}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                )}
                {!loading && totalPages > 0 && renderPagination()}
                {loading && totalPages > 0 && <div className="pagination"><p>...</p></div>}
            </div>
        </div>
      </main>
    </div>
  );
}

export default App;