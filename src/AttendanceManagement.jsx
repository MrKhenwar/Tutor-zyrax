import React, { useState, useEffect, useCallback } from "react";
import api from "./api";

const AttendanceManagement = () => {
  // State for attendance search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // State for class analytics
  const [classStats, setClassStats] = useState([]);
  const [classDays, setClassDays] = useState(7);
  const [classStatsLoading, setClassStatsLoading] = useState(false);

  const [error, setError] = useState(null);

  // Fetch class popularity analytics
  const fetchClassAnalytics = useCallback(async () => {
    setClassStatsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/zyrax/analytics/classes/`, {
        params: { days: classDays, limit: 10 }
      });

      // Validate response data
      if (response.data && Array.isArray(response.data.most_popular_classes)) {
        setClassStats(response.data.most_popular_classes);
      } else if (Array.isArray(response.data)) {
        setClassStats(response.data);
      } else {
        console.warn('Unexpected API response structure:', response.data);
        setClassStats([]);
      }
    } catch (err) {
      console.error('Error fetching class analytics:', err);
      setError(`Failed to fetch class analytics: ${err.response?.data?.detail || err.message}`);
      setClassStats([]);
    } finally {
      setClassStatsLoading(false);
    }
  }, [classDays]);

  // Search user attendance
  const handleSearchAttendance = async () => {
    if (!searchQuery.trim()) {
      setError("Please enter a name to search");
      return;
    }

    setSearchLoading(true);
    setError(null);
    try {
      const params = {
        search: searchQuery.trim(),
        month: selectedMonth,
        year: selectedYear
      };

      // Note: Using /attendance/search/ for now (Zyrax only)
      // TODO: Switch to /attendance/search-combined/ when backend is deployed
      const response = await api.get(`/zyrax/attendance/search/`, { params });

      // Validate response structure
      if (response.data && typeof response.data === 'object') {
        setSearchResults(response.data);
      } else {
        console.warn('Unexpected search response:', response.data);
        setError('Received invalid data from server');
        setSearchResults(null);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(`Search failed: ${err.response?.data?.detail || err.message}`);
      setSearchResults(null);
    } finally {
      setSearchLoading(false);
    }
  };

  // Load class analytics on component mount
  useEffect(() => {
    fetchClassAnalytics();
  }, [classDays, fetchClassAnalytics]);

  return (
    <div style={styles.container}>
      <h2 style={styles.mainTitle}>📊 Attendance & Analytics</h2>

      {error && <div style={styles.errorBox}>{error}</div>}

      {/* Class Distribution Chart Section */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3>📊 Class Distribution Statistics</h3>
          <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
            <label>Period:</label>
            <select
              value={classDays}
              onChange={(e) => setClassDays(parseInt(e.target.value))}
              style={styles.select}
            >
              <option value={1}>Today</option>
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button onClick={fetchClassAnalytics} style={styles.button}>
              Refresh
            </button>
          </div>
        </div>

        {classStatsLoading ? (
          <p>Loading statistics...</p>
        ) : classStats.length > 0 ? (
          <div style={{display: 'flex', gap: '40px', flexWrap: 'wrap', alignItems: 'center'}}>
            {/* Donut Chart */}
            <div style={{flex: '0 0 300px', position: 'relative'}}>
              <svg viewBox="0 0 200 200" style={{width: '300px', height: '300px'}}>
                {(() => {
                  const total = classStats.reduce((sum, cls) => sum + cls.join_count, 0);
                  const colors = ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0', '#00bcd4', '#ffeb3b', '#795548', '#e91e63', '#3f51b5'];
                  let currentAngle = 0;

                  return classStats.map((cls, index) => {
                    const percentage = (cls.join_count / total) * 100;
                    const angle = (cls.join_count / total) * 360;
                    const startAngle = currentAngle;
                    const endAngle = currentAngle + angle;
                    currentAngle = endAngle;

                    // Convert to radians
                    const startRad = (startAngle - 90) * (Math.PI / 180);
                    const endRad = (endAngle - 90) * (Math.PI / 180);

                    // Calculate arc path for donut
                    const outerRadius = 90;
                    const innerRadius = 55;

                    const x1 = 100 + outerRadius * Math.cos(startRad);
                    const y1 = 100 + outerRadius * Math.sin(startRad);
                    const x2 = 100 + outerRadius * Math.cos(endRad);
                    const y2 = 100 + outerRadius * Math.sin(endRad);
                    const x3 = 100 + innerRadius * Math.cos(endRad);
                    const y3 = 100 + innerRadius * Math.sin(endRad);
                    const x4 = 100 + innerRadius * Math.cos(startRad);
                    const y4 = 100 + innerRadius * Math.sin(startRad);

                    const largeArc = angle > 180 ? 1 : 0;

                    const pathData = `
                      M ${x1} ${y1}
                      A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2}
                      L ${x3} ${y3}
                      A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}
                      Z
                    `;

                    return (
                      <path
                        key={index}
                        d={pathData}
                        fill={colors[index % colors.length]}
                        stroke="#fff"
                        strokeWidth="2"
                      >
                        <title>{`${cls.zyrax_class__title}: ${cls.join_count} joins (${percentage.toFixed(1)}%)`}</title>
                      </path>
                    );
                  });
                })()}
                {/* Center text */}
                <text x="100" y="95" textAnchor="middle" fontSize="24" fontWeight="bold" fill="#333">
                  {classStats.reduce((sum, cls) => sum + cls.join_count, 0)}
                </text>
                <text x="100" y="112" textAnchor="middle" fontSize="12" fill="#666">
                  Total Joins
                </text>
              </svg>
            </div>

            {/* Legend */}
            <div style={{flex: '1 1 300px'}}>
              <h4 style={{margin: '0 0 15px 0', color: '#333'}}>Class Breakdown</h4>
              {classStats.map((cls, index) => {
                const colors = ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0', '#00bcd4', '#ffeb3b', '#795548', '#e91e63', '#3f51b5'];
                const total = classStats.reduce((sum, c) => sum + c.join_count, 0);
                const percentage = ((cls.join_count / total) * 100).toFixed(1);

                return (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '12px',
                    padding: '10px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: colors[index % colors.length],
                      borderRadius: '4px',
                      marginRight: '12px',
                      flexShrink: 0
                    }}></div>
                    <div style={{flex: 1}}>
                      <div style={{fontWeight: 'bold', color: '#333', marginBottom: '2px'}}>
                        {cls.zyrax_class__title}
                      </div>
                      <div style={{fontSize: '13px', color: '#666'}}>
                        ID: <span style={{fontFamily: 'monospace'}}>#{cls.zyrax_class__id}</span> • {cls.zyrax_class__time} • {cls.join_count} joins ({percentage}%)
                      </div>
                      <div style={{fontSize: '12px', color: '#999'}}>
                        {cls.unique_users} unique users
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p>No data available for this period.</p>
        )}
      </section>

      {/* Class Popularity Table Section */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3>🔥 Most Popular Classes</h3>
          <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
            <label>Last</label>
            <select
              value={classDays}
              onChange={(e) => setClassDays(parseInt(e.target.value))}
              style={styles.select}
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
            <button onClick={fetchClassAnalytics} style={styles.button}>
              Refresh
            </button>
          </div>
        </div>

        {classStatsLoading ? (
          <p>Loading class statistics...</p>
        ) : classStats.length > 0 ? (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Rank</th>
                  <th style={styles.th}>Class ID</th>
                  <th style={styles.th}>Class Title</th>
                  <th style={styles.th}>Time</th>
                  <th style={styles.th}>Total Joins</th>
                  <th style={styles.th}>Unique Users</th>
                </tr>
              </thead>
              <tbody>
                {classStats.map((cls, index) => (
                  <tr key={index} style={index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd}>
                    <td style={styles.td}>
                      <span style={styles.rankBadge}>{index + 1}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{fontFamily: 'monospace', color: '#666'}}>#{cls.zyrax_class__id}</span>
                    </td>
                    <td style={styles.td}>{cls.zyrax_class__title}</td>
                    <td style={styles.td}>{cls.zyrax_class__time}</td>
                    <td style={styles.td}>
                      <strong>{cls.join_count}</strong>
                    </td>
                    <td style={styles.td}>{cls.unique_users}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No class statistics available for this period.</p>
        )}
      </section>

      {/* User Attendance Search Section */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h3>🔍 Search User Attendance</h3>
        </div>

        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Enter user name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearchAttendance();
            }}
            style={{...styles.input, flex: 2}}
          />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            style={styles.select}
          >
            <option value={1}>January</option>
            <option value={2}>February</option>
            <option value={3}>March</option>
            <option value={4}>April</option>
            <option value={5}>May</option>
            <option value={6}>June</option>
            <option value={7}>July</option>
            <option value={8}>August</option>
            <option value={9}>September</option>
            <option value={10}>October</option>
            <option value={11}>November</option>
            <option value={12}>December</option>
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            style={styles.select}
          >
            {(() => {
              const currentYear = new Date().getFullYear();
              const years = [];
              for (let year = 2024; year <= currentYear + 1; year++) {
                years.push(year);
              }
              return years.map(year => (
                <option key={year} value={year}>{year}</option>
              ));
            })()}
          </select>
          <button
            onClick={handleSearchAttendance}
            style={styles.primaryButton}
            disabled={searchLoading}
          >
            {searchLoading ? "Searching..." : "Search"}
          </button>
        </div>

        {searchLoading ? (
          <p>Searching...</p>
        ) : searchResults ? (
          <div style={styles.resultsContainer}>
            {/* User Info */}
            <div style={styles.userInfoCard}>
              <h4 style={{margin: '0 0 10px 0', color: '#333'}}>
                {searchResults.user_info?.first_name} {searchResults.user_info?.last_name}
              </h4>
              <p style={{margin: '5px 0', color: '#666'}}>
                Username: <strong>{searchResults.user_info?.username}</strong>
              </p>
              <p style={{margin: '5px 0', color: '#666'}}>
                Period: <strong>{new Date(searchResults.year, searchResults.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</strong>
              </p>
              {searchResults.total_joins > 0 && searchResults.all_classes.length === 0 && (
                <div style={{
                  marginTop: '10px',
                  padding: '10px',
                  backgroundColor: '#fff3cd',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#856404'
                }}>
                  ℹ️ Historical attendance records don't include specific class names.
                  Class tracking started recently - future records will show class details.
                </div>
              )}
            </div>

            {/* Statistics Cards */}
            <div style={styles.statsGrid}>
              <div style={{...styles.statCard, backgroundColor: '#e8f5e9'}}>
                <div style={styles.statValue}>{searchResults.total_joins}</div>
                <div style={styles.statLabel}>Total Attendance Days (Zyrax)</div>
              </div>
              {searchResults.most_joined_class ? (
                <div style={{...styles.statCard, backgroundColor: '#fff3e0'}}>
                  <div style={{fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '8px'}}>
                    {searchResults.most_joined_class.class_title}
                  </div>
                  <div style={styles.statLabel}>Most Joined Class</div>
                  <div style={{marginTop: '5px', color: '#666'}}>
                    {searchResults.most_joined_class.join_count} times
                  </div>
                </div>
              ) : searchResults.all_classes.length === 0 && searchResults.total_joins > 0 && (
                <div style={{...styles.statCard, backgroundColor: '#f5f5f5'}}>
                  <div style={{fontSize: '14px', color: '#999', textAlign: 'center', fontStyle: 'italic'}}>
                    Class details not available for historical records
                  </div>
                </div>
              )}
            </div>

            {/* Monthly Calendar */}
            {searchResults.monthly_calendar && searchResults.monthly_calendar.length > 0 && (
              <div style={{marginTop: '30px'}}>
                <h4 style={{margin: '0 0 15px 0', color: '#333'}}>📅 Monthly Calendar</h4>
                <div style={styles.calendarGrid}>
                  {searchResults.monthly_calendar.map((day) => (
                    <div
                      key={day.date}
                      style={{
                        ...styles.calendarDay,
                        backgroundColor: day.has_attendance ? '#4caf50' : '#f5f5f5',
                        color: day.has_attendance ? '#fff' : '#999'
                      }}
                      title={day.has_attendance ? `${day.join_count} class(es) joined` : 'No attendance'}
                    >
                      <div style={{fontSize: '18px', fontWeight: 'bold'}}>{day.day}</div>
                      {day.has_attendance && (
                        <div style={{fontSize: '11px', marginTop: '2px'}}>{day.join_count}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Classes Breakdown */}
            {searchResults.all_classes && searchResults.all_classes.length > 0 && (
              <div style={{marginTop: '30px'}}>
                <h4 style={{margin: '0 0 15px 0', color: '#333'}}>📚 Classes Breakdown</h4>
                <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Rank</th>
                        <th style={styles.th}>Class ID</th>
                        <th style={styles.th}>Class Title</th>
                        <th style={styles.th}>Time</th>
                        <th style={styles.th}>Times Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.all_classes.map((cls, index) => (
                        <tr key={index} style={index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd}>
                          <td style={styles.td}>
                            <span style={styles.rankBadge}>{index + 1}</span>
                          </td>
                          <td style={styles.td}>
                            <span style={{fontFamily: 'monospace', color: '#666'}}>#{cls.zyrax_class__id || 'N/A'}</span>
                          </td>
                          <td style={styles.td}>{cls.zyrax_class__title}</td>
                          <td style={styles.td}>{cls.zyrax_class__time}</td>
                          <td style={styles.td}>
                            <strong>{cls.join_count}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Detailed Attendance Records */}
            {searchResults.attendance_records && searchResults.attendance_records.length > 0 && (
              <div style={{marginTop: '30px'}}>
                <h4 style={{margin: '0 0 15px 0', color: '#333'}}>
                  📋 Detailed Attendance Records ({searchResults.attendance_records.length})
                </h4>
                <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Date</th>
                        <th style={styles.th}>Platform</th>
                        <th style={styles.th}>Class</th>
                        <th style={styles.th}>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.attendance_records.map((record) => (
                        <tr key={record.id} style={styles.tableRowEven}>
                          <td style={styles.td}>
                            {new Date(record.date).toLocaleDateString()}
                          </td>
                          <td style={styles.td}>
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              backgroundColor: '#e3f2fd',
                              color: '#1976d2'
                            }}>
                              {record.platform || 'Zyrax'}
                            </span>
                          </td>
                          <td style={styles.td}>
                            {record.class_title ? (
                              <span>{record.class_title}</span>
                            ) : (
                              <span style={{color: '#999', fontStyle: 'italic'}}>
                                Attendance Marked
                              </span>
                            )}
                          </td>
                          <td style={styles.td}>
                            {new Date(record.created_at).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : searchQuery && !searchLoading ? (
          <p style={styles.noResults}>
            No attendance records found for "{searchQuery}"
          </p>
        ) : null}
      </section>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },
  mainTitle: {
    color: '#333',
    marginBottom: '10px',
  },
  section: {
    backgroundColor: '#fff',
    padding: '25px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  datePickerContainer: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  input: {
    padding: '10px 15px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    fontSize: '14px',
    minWidth: '150px',
  },
  select: {
    padding: '10px 15px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    fontSize: '14px',
    cursor: 'pointer',
  },
  button: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#007bff',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  primaryButton: {
    padding: '10px 25px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#28a745',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  secondaryButton: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: '1px solid #6c757d',
    backgroundColor: '#fff',
    color: '#6c757d',
    cursor: 'pointer',
    fontSize: '14px',
  },
  errorBox: {
    color: '#721c24',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
  },
  statCard: {
    padding: '30px 20px',
    borderRadius: '12px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  statValue: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '8px',
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  searchContainer: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  resultsContainer: {
    marginTop: '20px',
  },
  resultsCount: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '15px',
    fontWeight: 'bold',
  },
  noResults: {
    textAlign: 'center',
    color: '#999',
    padding: '40px',
    fontStyle: 'italic',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#fff',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    backgroundColor: '#f8f9fa',
    borderBottom: '2px solid #dee2e6',
    fontWeight: 'bold',
    fontSize: '14px',
    color: '#495057',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #dee2e6',
    fontSize: '14px',
    color: '#212529',
  },
  tableRowEven: {
    backgroundColor: '#fff',
  },
  tableRowOdd: {
    backgroundColor: '#f8f9fa',
  },
  rankBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '12px',
    backgroundColor: '#007bff',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  userInfoCard: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '20px',
    border: '1px solid #dee2e6',
  },
  calendarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '10px',
    marginTop: '10px',
  },
  calendarDay: {
    padding: '15px 10px',
    borderRadius: '8px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    border: '1px solid #e0e0e0',
  },
};

export default AttendanceManagement;
