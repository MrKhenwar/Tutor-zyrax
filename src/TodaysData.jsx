import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

const CollapsibleSection = ({ title, defaultOpen = true, badge, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section style={styles.section}>
      <button
        style={styles.sectionToggle}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span style={styles.sectionTitle}>{title}</span>
        <span style={styles.toggleRow}>
          {badge !== undefined && (
            <span style={styles.countBadge}>{badge}</span>
          )}
          <span style={styles.chevron}>{open ? '▲' : '▼'}</span>
        </span>
      </button>
      {open && <div style={styles.sectionBody}>{children}</div>}
    </section>
  );
};

const TodaysData = () => {
  const navigate = useNavigate();
  const [todayStats, setTodayStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTodaysData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/zyrax/analytics/todays-detailed-attendance/`);
      if (response.data) {
        setTodayStats(response.data);
      } else {
        setTodayStats({
          date: new Date().toISOString().split('T')[0],
          zyrax: { total_users: 0, total_attendance: 0, users: [], classes: [] },
          zylo: { total_users: 0, total_attendance: 0, users: [], classes: [] },
        });
      }
    } catch (err) {
      console.error("Error fetching today's data:", err);
      setError(`Failed to fetch data: ${err.response?.data?.detail || err.message}`);
      setTodayStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodaysData();
    const interval = setInterval(fetchTodaysData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchTodaysData]);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.mainTitle}>📅 Today's Attendance</h2>
          <p style={styles.subtitle}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            })}
          </p>
        </div>
        <div style={styles.headerActions}>
          <button onClick={fetchTodaysData} style={styles.refreshButton} disabled={loading}>
            {loading ? '🔄 Refreshing...' : '🔄 Refresh'}
          </button>
          <button onClick={() => navigate('/')} style={styles.backButton}>
            ← Back
          </button>
        </div>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}

      {loading && !todayStats ? (
        <div style={styles.loadingContainer}>
          <p>Loading today's data...</p>
        </div>
      ) : todayStats ? (
        <>
          {/* Summary — always visible */}
          <section style={styles.section}>
            <div style={{ ...styles.sectionToggle, cursor: 'default' }}>
              <span style={styles.sectionTitle}>📊 Today's Summary</span>
            </div>
            <div style={styles.sectionBody}>
              <div style={styles.statsGrid}>
                <div style={{ ...styles.statCard, backgroundColor: '#e3f2fd' }}>
                  <div style={styles.statValue}>
                    {(todayStats.zyrax?.total_attendance || 0) + (todayStats.zylo?.total_attendance || 0)}
                  </div>
                  <div style={styles.statLabel}>Total Attendance</div>
                  <div style={styles.platformBreakdown}>
                    <span style={styles.zyraxBadge}>Zyrax: {todayStats.zyrax?.total_attendance || 0}</span>
                    <span style={styles.zyloBadge}>Zylo: {todayStats.zylo?.total_attendance || 0}</span>
                  </div>
                </div>
                <div style={{ ...styles.statCard, backgroundColor: '#f3e5f5' }}>
                  <div style={styles.statValue}>
                    {(todayStats.zyrax?.total_users || 0) + (todayStats.zylo?.total_users || 0)}
                  </div>
                  <div style={styles.statLabel}>Unique Users</div>
                  <div style={styles.platformBreakdown}>
                    <span style={styles.zyraxBadge}>Zyrax: {todayStats.zyrax?.total_users || 0}</span>
                    <span style={styles.zyloBadge}>Zylo: {todayStats.zylo?.total_users || 0}</span>
                  </div>
                </div>
                <div style={{ ...styles.statCard, backgroundColor: '#e8f5e9' }}>
                  <div style={styles.statValue}>{todayStats.zyrax?.classes?.length || 0}</div>
                  <div style={styles.statLabel}>Zyrax Classes</div>
                </div>
                <div style={{ ...styles.statCard, backgroundColor: '#fff3e0' }}>
                  <div style={styles.statValue}>{todayStats.zylo?.classes?.length || 0}</div>
                  <div style={styles.statLabel}>Zylo Classes</div>
                </div>
              </div>
            </div>
          </section>

          {/* Zyrax Users */}
          <CollapsibleSection
            title="👥 Zyrax Users Today"
            badge={todayStats.zyrax?.total_users || 0}
            defaultOpen={false}
          >
            {todayStats.zyrax?.users && todayStats.zyrax.users.length > 0 ? (
              <div style={styles.usersGrid}>
                {todayStats.zyrax.users.map((user) => (
                  <div key={user.user_id} style={styles.userCard}>
                    <div style={styles.userIcon}>👤</div>
                    <div style={styles.userName}>
                      {user.full_name || `${user.first_name} ${user.last_name}`.trim()}
                    </div>
                    <div style={styles.userUsername}>@{user.username}</div>
                    <div style={{ ...styles.userPlatform, backgroundColor: '#007bff' }}>Zyrax</div>
                    <div style={styles.userClassCount}>
                      {user.classes.length} {user.classes.length === 1 ? 'class' : 'classes'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.noData}>No Zyrax users attended classes today yet.</div>
            )}
          </CollapsibleSection>

          {/* Zylo Users */}
          <CollapsibleSection
            title="👥 Zylo Users Today"
            badge={todayStats.zylo?.total_users || 0}
            defaultOpen={false}
          >
            {todayStats.zylo?.users && todayStats.zylo.users.length > 0 ? (
              <div style={styles.usersGrid}>
                {todayStats.zylo.users.map((user) => (
                  <div key={user.user_id} style={styles.userCard}>
                    <div style={styles.userIcon}>👤</div>
                    <div style={styles.userName}>
                      {user.full_name || `${user.first_name} ${user.last_name}`.trim()}
                    </div>
                    <div style={styles.userUsername}>@{user.username}</div>
                    <div style={{ ...styles.userPlatform, backgroundColor: '#ff9800' }}>Zylo</div>
                    <div style={styles.userClassCount}>
                      {user.classes.length} {user.classes.length === 1 ? 'class' : 'classes'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.noData}>No Zylo users attended classes today yet.</div>
            )}
          </CollapsibleSection>

          {/* Zyrax Classes */}
          <CollapsibleSection
            title="🧘 Zyrax Classes"
            badge={todayStats.zyrax?.classes?.length || 0}
            defaultOpen={false}
          >
            {todayStats.zyrax?.classes && todayStats.zyrax.classes.length > 0 ? (
              <div style={styles.classesContainer}>
                {todayStats.zyrax.classes.map((cls, index) => (
                  <ClassCard key={index} cls={cls} accentColor="#28a745" />
                ))}
              </div>
            ) : (
              <div style={styles.noData}>No Zyrax classes attended today.</div>
            )}
          </CollapsibleSection>

          {/* Zylo Classes */}
          <CollapsibleSection
            title="💪 Zylo Classes"
            badge={todayStats.zylo?.classes?.length || 0}
            defaultOpen={false}
          >
            {todayStats.zylo?.classes && todayStats.zylo.classes.length > 0 ? (
              <div style={styles.classesContainer}>
                {todayStats.zylo.classes.map((cls, index) => (
                  <ClassCard key={index} cls={cls} accentColor="#ff9800" userBadgeBg="#fff3e0" />
                ))}
              </div>
            ) : (
              <div style={styles.noData}>No Zylo classes attended today.</div>
            )}
          </CollapsibleSection>

          {/* Most Popular */}
          <CollapsibleSection title="🔥 Most Popular Classes Today" defaultOpen={true}>
            {(() => {
              const allClasses = [
                ...(todayStats.zyrax?.classes || []).map((cls) => ({ ...cls, platform: 'Zyrax' })),
                ...(todayStats.zylo?.classes || []).map((cls) => ({ ...cls, platform: 'Zylo' })),
              ];
              return allClasses.length > 0 ? (
                <div style={styles.tableContainer}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Rank</th>
                        <th style={styles.th}>ID</th>
                        <th style={styles.th}>Class Title</th>
                        <th style={styles.th}>Time</th>
                        <th style={styles.th}>Platform</th>
                        <th style={styles.th}>Attendance</th>
                        <th style={styles.th}>Unique Users</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allClasses
                        .sort((a, b) => b.attendance_count - a.attendance_count)
                        .map((cls, index) => (
                          <tr key={index} style={index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd}>
                            <td style={styles.td}>
                              <span
                                style={{
                                  ...styles.rankBadge,
                                  backgroundColor:
                                    index === 0 ? '#ffd700' :
                                    index === 1 ? '#c0c0c0' :
                                    index === 2 ? '#cd7f32' : '#007bff',
                                }}
                              >
                                {index + 1}
                              </span>
                            </td>
                            <td style={styles.td}>
                              <span style={{ fontFamily: 'monospace', color: '#666' }}>#{cls.class_id}</span>
                            </td>
                            <td style={styles.td}>{cls.class_title}</td>
                            <td style={styles.td}>{cls.class_time}</td>
                            <td style={styles.td}>
                              <span
                                style={{
                                  ...styles.platformBadgeSmall,
                                  backgroundColor: cls.platform === 'Zyrax' ? '#007bff' : '#ff9800',
                                }}
                              >
                                {cls.platform}
                              </span>
                            </td>
                            <td style={styles.td}><strong>{cls.attendance_count}</strong></td>
                            <td style={styles.td}>{cls.users.length}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={styles.noData}>No class data available for today.</div>
              );
            })()}
          </CollapsibleSection>
        </>
      ) : (
        <div style={styles.noDataContainer}>
          <p>No data available for today. Please try refreshing.</p>
        </div>
      )}

      <div style={styles.footer}>
        <p style={styles.footerText}>
          Auto-refreshes every 5 minutes · Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

const ClassCard = ({ cls, accentColor = '#28a745', userBadgeBg = '#e3f2fd' }) => {
  const [showUsers, setShowUsers] = useState(false);
  return (
    <div style={styles.classCard}>
      <div style={styles.classHeader}>
        <div style={styles.classTitle}>
          <span style={styles.classId}>#{cls.class_id}</span>
          {cls.class_title}
        </div>
        <div style={styles.classTime}>{cls.class_time}</div>
      </div>
      <div style={styles.classStats}>
        <div style={styles.classStatItem}>
          <span style={{ ...styles.classStatValue, color: accentColor }}>{cls.attendance_count}</span>
          <span style={styles.classStatLabel}>Attendance</span>
        </div>
        <div style={styles.classStatItem}>
          <span style={{ ...styles.classStatValue, color: accentColor }}>{cls.users.length}</span>
          <span style={styles.classStatLabel}>Unique Users</span>
        </div>
      </div>
      <div style={styles.progressBar}>
        <div
          style={{
            ...styles.progressFill,
            width: `${Math.min((cls.attendance_count / 20) * 100, 100)}%`,
            backgroundColor: accentColor,
          }}
        />
      </div>
      {cls.users.length > 0 && (
        <button
          style={{ ...styles.toggleUsersBtn, color: accentColor, borderColor: accentColor }}
          onClick={() => setShowUsers((v) => !v)}
        >
          {showUsers ? '▲ Hide users' : `▼ Show ${cls.users.length} user${cls.users.length === 1 ? '' : 's'}`}
        </button>
      )}
      {showUsers && cls.users.length > 0 && (
        <div style={styles.classUsersList}>
          {cls.users.map((user, i) => (
            <div key={i} style={{ ...styles.classUserBadge, backgroundColor: userBadgeBg }}>
              <span style={styles.classUserName}>{user.full_name}</span>
              <span style={styles.classUserUsername}>@{user.username}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '16px',
    maxWidth: '1400px',
    margin: '0 auto',
    backgroundColor: '#f5f7fa',
    minHeight: '100vh',
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '12px',
    backgroundColor: '#fff',
    padding: '18px 20px',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    marginBottom: '16px',
  },
  mainTitle: {
    color: '#333',
    margin: '0 0 4px 0',
    fontSize: '24px',
    fontWeight: '700',
  },
  subtitle: {
    color: '#666',
    margin: '0',
    fontSize: '14px',
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  refreshButton: {
    padding: '9px 18px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#28a745',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
  },
  backButton: {
    padding: '9px 18px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#6c757d',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
  },
  errorBox: {
    color: '#721c24',
    backgroundColor: '#f8d7da',
    border: '1px solid #f5c6cb',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '14px',
    fontSize: '14px',
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '60px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    color: '#666',
  },
  noDataContainer: {
    textAlign: 'center',
    padding: '60px',
    backgroundColor: '#fff',
    borderRadius: '12px',
    color: '#999',
    fontStyle: 'italic',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    marginBottom: '12px',
    overflow: 'hidden',
  },
  sectionToggle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '14px 18px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    borderBottom: '1px solid #f0f0f0',
  },
  sectionTitle: {
    color: '#333',
    fontSize: '16px',
    fontWeight: '600',
    margin: 0,
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  countBadge: {
    backgroundColor: '#007bff',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 'bold',
    padding: '2px 8px',
    borderRadius: '10px',
    minWidth: '24px',
    textAlign: 'center',
  },
  chevron: {
    fontSize: '12px',
    color: '#666',
  },
  sectionBody: {
    padding: '16px 18px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '14px',
  },
  statCard: {
    padding: '20px 14px',
    borderRadius: '10px',
    textAlign: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.07)',
  },
  statValue: {
    fontSize: '36px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '6px',
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.8px',
    fontWeight: '600',
  },
  platformBreakdown: {
    display: 'flex',
    gap: '6px',
    justifyContent: 'center',
    marginTop: '10px',
    flexWrap: 'wrap',
  },
  zyraxBadge: {
    fontSize: '11px',
    padding: '3px 7px',
    borderRadius: '4px',
    backgroundColor: '#007bff',
    color: '#fff',
    fontWeight: '600',
  },
  zyloBadge: {
    fontSize: '11px',
    padding: '3px 7px',
    borderRadius: '4px',
    backgroundColor: '#ff9800',
    color: '#fff',
    fontWeight: '600',
  },
  usersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
    gap: '12px',
  },
  userCard: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #e0e0e0',
    borderRadius: '10px',
    padding: '14px',
    textAlign: 'center',
  },
  userIcon: {
    fontSize: '28px',
    marginBottom: '8px',
  },
  userName: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '4px',
  },
  userUsername: {
    fontSize: '11px',
    color: '#666',
    marginBottom: '7px',
  },
  userPlatform: {
    fontSize: '10px',
    color: '#fff',
    padding: '2px 7px',
    borderRadius: '4px',
    display: 'inline-block',
    fontWeight: '600',
  },
  userClassCount: {
    fontSize: '11px',
    color: '#666',
    marginTop: '6px',
    fontStyle: 'italic',
  },
  classesContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '14px',
  },
  classCard: {
    backgroundColor: '#fafafa',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    padding: '16px',
  },
  classHeader: {
    marginBottom: '12px',
    paddingBottom: '12px',
    borderBottom: '1px solid #e0e0e0',
  },
  classTitle: {
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '5px',
  },
  classId: {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#999',
    marginRight: '6px',
  },
  classTime: {
    fontSize: '13px',
    color: '#666',
  },
  classStats: {
    display: 'flex',
    justifyContent: 'space-around',
    marginBottom: '12px',
  },
  classStatItem: {
    textAlign: 'center',
  },
  classStatValue: {
    display: 'block',
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#007bff',
  },
  classStatLabel: {
    display: 'block',
    fontSize: '10px',
    color: '#999',
    textTransform: 'uppercase',
    marginTop: '2px',
  },
  progressBar: {
    width: '100%',
    height: '6px',
    backgroundColor: '#e0e0e0',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '10px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#28a745',
    borderRadius: '3px',
    transition: 'width 0.3s ease',
  },
  toggleUsersBtn: {
    background: 'none',
    border: '1px solid',
    borderRadius: '5px',
    padding: '4px 10px',
    fontSize: '12px',
    cursor: 'pointer',
    fontWeight: '500',
    marginBottom: '8px',
  },
  classUsersList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginTop: '6px',
  },
  classUserBadge: {
    backgroundColor: '#e3f2fd',
    padding: '6px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    border: '1px solid #90caf9',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  classUserName: {
    fontWeight: '600',
    color: '#333',
  },
  classUserUsername: {
    color: '#666',
    fontSize: '10px',
  },
  noData: {
    textAlign: 'center',
    padding: '30px',
    color: '#999',
    fontStyle: 'italic',
    fontSize: '14px',
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
    padding: '10px 12px',
    textAlign: 'left',
    backgroundColor: '#f8f9fa',
    borderBottom: '2px solid #dee2e6',
    fontWeight: 'bold',
    fontSize: '13px',
    color: '#495057',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: '10px 12px',
    borderBottom: '1px solid #dee2e6',
    fontSize: '13px',
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
    borderRadius: '10px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  platformBadgeSmall: {
    fontSize: '11px',
    padding: '3px 8px',
    borderRadius: '4px',
    color: '#fff',
    fontWeight: '600',
    display: 'inline-block',
  },
  footer: {
    textAlign: 'center',
    padding: '16px',
    marginTop: '8px',
  },
  footerText: {
    color: '#999',
    fontSize: '12px',
    margin: '0',
  },
};

export default TodaysData;
