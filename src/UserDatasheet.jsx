import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api";

// inject spinner keyframe once
if (!document.getElementById("ds-spin-style")) {
  const s = document.createElement("style");
  s.id = "ds-spin-style";
  s.textContent = "@keyframes spin { to { transform: rotate(360deg); } }";
  document.head.appendChild(s);
}

// ─── helpers ────────────────────────────────────────────────────────────────

const fmt = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const classBadgeColor = (type) => {
  if (type === "yoga") return { background: "#e8f5e9", color: "#2e7d32" };
  if (type === "zumba") return { background: "#fce4ec", color: "#c62828" };
  return { background: "#e3f2fd", color: "#1565c0" };
};

const statusBadge = (sub) => {
  if (!sub) return { label: "No Plan", style: { background: "#f5f5f5", color: "#757575" } };
  if (sub.is_on_hold) return { label: "On Hold", style: { background: "#fff8e1", color: "#f57f17" } };
  if (sub.is_active) return { label: "Active", style: { background: "#e8f5e9", color: "#2e7d32" } };
  return { label: "Expired", style: { background: "#fce4ec", color: "#c62828" } };
};

// ─── CSV export ─────────────────────────────────────────────────────────────

const exportCSV = (users, platform) => {
  const headers = [
    "Name", "Phone", "Username", "Date Joined", "DOB",
    "Goal", platform === "zyrax" ? "User Type" : null,
    "Plan", "Plan Start", "Plan End", "Status", "Days Left", "Amount Paid",
    "Total Attendance", "This Month", "Last Attended", "Favourite Class",
  ].filter(Boolean);

  const rows = users.map((u) => {
    const sub = u.subscription;
    const row = [
      u.full_name,
      u.phone_number,
      u.username,
      fmt(u.date_joined),
      fmt(u.date_of_birth),
      u.goal || "—",
      ...(platform === "zyrax" ? [u.user_type || "—"] : []),
      sub ? sub.plan_name : "—",
      sub ? fmt(sub.start_date) : "—",
      sub ? fmt(sub.end_date) : "—",
      sub ? (sub.is_on_hold ? "On Hold" : sub.is_active ? "Active" : "Expired") : "No Plan",
      sub ? sub.days_remaining : 0,
      sub ? sub.amount_paid : "—",
      u.total_attendance,
      u.month_attendance,
      fmt(u.last_attended_date),
      u.most_attended_class ? u.most_attended_class.class_name : "—",
    ];
    return row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${platform}-users-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// ─── sub-component: class breakdown row ─────────────────────────────────────

const ClassBreakdown = ({ classes }) => {
  if (!classes || classes.length === 0)
    return <span style={{ color: "#9e9e9e", fontSize: 12 }}>No class data</span>;

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "6px 0" }}>
      {classes.map((c) => (
        <span
          key={c.class_id}
          style={{
            ...classBadgeColor(c.class_type),
            borderRadius: 12,
            padding: "3px 10px",
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          {c.class_name} × {c.attendance_count}
        </span>
      ))}
    </div>
  );
};

// ─── main component ──────────────────────────────────────────────────────────

const UserDatasheet = () => {
  const navigate = useNavigate();
  const [platform, setPlatform] = useState("zyrax");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());

  // filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("full_name");
  const [sortDir, setSortDir] = useState("asc");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setExpandedRows(new Set());
    try {
      const res = await api.get(`/${platform}/admin/user-datasheet/`, { timeout: 60000 });
      setUsers(res.data.users || []);
    } catch (err) {
      if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
        setError("Request timed out — the server is taking too long. Try refreshing.");
      } else {
        setError(err.response?.data?.error || err.response?.data?.details || err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [platform]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleRow = (id) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    let list = [...users];

    // text search
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (u) =>
          u.full_name.toLowerCase().includes(q) ||
          u.phone_number.includes(q) ||
          u.username.toLowerCase().includes(q)
      );
    }

    // status filter
    if (statusFilter !== "all") {
      list = list.filter((u) => {
        const sub = u.subscription;
        if (statusFilter === "active") return sub && sub.is_active && !sub.is_on_hold;
        if (statusFilter === "hold") return sub && sub.is_on_hold;
        if (statusFilter === "expired") return sub && !sub.is_active;
        if (statusFilter === "no_plan") return !sub;
        if (statusFilter === "trial") return u.has_used_trial;
        if (statusFilter === "no_profile") return !u.has_profile;
        return true;
      });
    }

    // sort
    list.sort((a, b) => {
      let av, bv;
      switch (sortField) {
        case "full_name": av = a.full_name; bv = b.full_name; break;
        case "date_joined": av = a.date_joined; bv = b.date_joined; break;
        case "plan_end": av = a.subscription?.end_date || ""; bv = b.subscription?.end_date || ""; break;
        case "total_attendance": av = a.total_attendance; bv = b.total_attendance; break;
        case "month_attendance": av = a.month_attendance; bv = b.month_attendance; break;
        case "days_remaining": av = a.subscription?.days_remaining ?? -1; bv = b.subscription?.days_remaining ?? -1; break;
        default: av = a.full_name; bv = b.full_name;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [users, search, statusFilter, sortField, sortDir]);

  const SortTh = ({ field, label, right }) => (
    <th
      onClick={() => handleSort(field)}
      style={{ ...styles.th, textAlign: right ? "right" : "left", cursor: "pointer", userSelect: "none" }}
    >
      {label}
      {sortField === field ? (sortDir === "asc" ? " ▲" : " ▼") : " ⇅"}
    </th>
  );

  const summary = useMemo(() => {
    const active = users.filter((u) => u.subscription?.is_active && !u.subscription?.is_on_hold).length;
    const hold = users.filter((u) => u.subscription?.is_on_hold).length;
    const expired = users.filter((u) => u.subscription && !u.subscription.is_active).length;
    const noPlan = users.filter((u) => !u.subscription).length;
    const noProfile = users.filter((u) => !u.has_profile).length;
    const totalAtt = users.reduce((s, u) => s + u.total_attendance, 0);
    return { active, hold, expired, noPlan, noProfile, totalAtt };
  }, [users]);

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>User Datasheet</h1>
          <p style={styles.subtitle}>Complete overview of every user — subscriptions, attendance & class preferences</p>
        </div>
        <button onClick={() => navigate("/")} style={styles.backBtn}>
          ← Dashboard
        </button>
      </div>

      {/* Platform tabs */}
      <div style={styles.tabs}>
        {["zyrax", "zylo"].map((p) => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            style={{ ...styles.tab, ...(platform === p ? styles.tabActive : {}) }}
          >
            {p === "zyrax" ? "Zyrax (Yoga & Zumba)" : "Zylo (Fitness)"}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      {!loading && users.length > 0 && (
        <div style={styles.cards}>
          <div style={styles.card}><div style={styles.cardNum}>{users.length}</div><div style={styles.cardLabel}>Total Users</div></div>
          <div style={{ ...styles.card, borderTop: "3px solid #2e7d32" }}><div style={styles.cardNum}>{summary.active}</div><div style={styles.cardLabel}>Active Plans</div></div>
          <div style={{ ...styles.card, borderTop: "3px solid #f57f17" }}><div style={styles.cardNum}>{summary.hold}</div><div style={styles.cardLabel}>On Hold</div></div>
          <div style={{ ...styles.card, borderTop: "3px solid #c62828" }}><div style={styles.cardNum}>{summary.expired}</div><div style={styles.cardLabel}>Expired</div></div>
          <div style={{ ...styles.card, borderTop: "3px solid #757575" }}><div style={styles.cardNum}>{summary.noPlan}</div><div style={styles.cardLabel}>No Plan</div></div>
          <div style={{ ...styles.card, borderTop: "3px solid #e65100" }}><div style={styles.cardNum}>{summary.noProfile}</div><div style={styles.cardLabel}>No Profile</div></div>
          <div style={{ ...styles.card, borderTop: "3px solid #1565c0" }}><div style={styles.cardNum}>{summary.totalAtt}</div><div style={styles.cardLabel}>Total Attendances</div></div>
        </div>
      )}

      {/* Toolbar */}
      <div style={styles.toolbar}>
        <input
          type="text"
          placeholder="Search by name, phone, or username…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={styles.select}>
          <option value="all">All Users</option>
          <option value="active">Active Plan</option>
          <option value="hold">On Hold</option>
          <option value="expired">Expired Plan</option>
          <option value="no_plan">No Plan</option>
          <option value="trial">Used Trial</option>
          <option value="no_profile">No Profile</option>
        </select>
        <button onClick={() => exportCSV(filtered, platform)} style={styles.exportBtn}>
          Export CSV ({filtered.length})
        </button>
        <button onClick={fetchData} style={styles.refreshBtn}>↻ Refresh</button>
      </div>

      {/* Error */}
      {error && <div style={styles.errorBox}>Error: {error}</div>}

      {/* Loading */}
      {loading && (
        <div style={styles.loadingBox}>
          <div style={styles.spinner} />
          <div style={{ marginTop: 16 }}>Fetching all user data…</div>
          <div style={{ fontSize: 12, color: "#9e9e9e", marginTop: 6 }}>
            Aggregating subscriptions, attendance & class stats
          </div>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: 32 }} />
                <SortTh field="full_name" label="Name" />
                <th style={styles.th}>Phone</th>
                <SortTh field="date_joined" label="Joined" />
                {platform === "zyrax" && <th style={styles.th}>Type</th>}
                <th style={styles.th}>Goal</th>
                <th style={styles.th}>Plan</th>
                <SortTh field="plan_end" label="Start → End" />
                <SortTh field="days_remaining" label="Days Left" right />
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Amount</th>
                <SortTh field="total_attendance" label="Total Att." right />
                <SortTh field="month_attendance" label="This Month" right />
                <th style={styles.th}>Last Attended</th>
                <th style={styles.th}>Favourite Class</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={platform === "zyrax" ? 15 : 14} style={styles.emptyCell}>
                    No users found
                  </td>
                </tr>
              )}
              {filtered.map((u) => {
                const sub = u.subscription;
                const badge = statusBadge(sub);
                const expanded = expandedRows.has(u.id);
                return (
                  <React.Fragment key={u.id}>
                    <tr style={{ background: expanded ? "#f0f7ff" : undefined }}>
                      <td style={styles.td}>
                        <button
                          onClick={() => toggleRow(u.id)}
                          style={styles.expandBtn}
                          title="Show class breakdown"
                        >
                          {expanded ? "▾" : "▸"}
                        </button>
                      </td>
                      <td style={styles.td}>
                        <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                          {u.full_name || u.username}
                          {!u.has_profile && (
                            <span style={{ background: "#fff3e0", color: "#e65100", borderRadius: 8, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>
                              no profile
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "#757575" }}>{u.username}</div>
                      </td>
                      <td style={styles.td}>{u.phone_number}</td>
                      <td style={styles.td}>{fmt(u.date_joined)}</td>
                      {platform === "zyrax" && (
                        <td style={styles.td}>
                          {u.user_type && (
                            <span style={{ ...classBadgeColor(u.user_type), borderRadius: 10, padding: "2px 8px", fontSize: 12 }}>
                              {u.user_type}
                            </span>
                          )}
                        </td>
                      )}
                      <td style={styles.td}>{u.goal ? u.goal.replace(/_/g, " ") : "—"}</td>
                      <td style={styles.td}>{sub ? sub.plan_name : "—"}</td>
                      <td style={styles.td}>
                        {sub ? (
                          <span style={{ fontSize: 12 }}>
                            {fmt(sub.start_date)}<br /><span style={{ color: "#757575" }}>→ {fmt(sub.end_date)}</span>
                          </span>
                        ) : "—"}
                      </td>
                      <td style={{ ...styles.td, textAlign: "right", fontWeight: 600 }}>
                        {sub && sub.is_active ? (
                          <span style={{ color: sub.days_remaining <= 7 ? "#c62828" : "#2e7d32" }}>
                            {sub.days_remaining}d
                          </span>
                        ) : "—"}
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...badge.style, borderRadius: 10, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>
                          {badge.label}
                        </span>
                        {u.has_used_trial && (
                          <span style={{ marginLeft: 4, background: "#ede7f6", color: "#512da8", borderRadius: 10, padding: "2px 7px", fontSize: 11 }}>
                            trial
                          </span>
                        )}
                      </td>
                      <td style={{ ...styles.td, textAlign: "right" }}>
                        {sub ? `₹${sub.amount_paid}` : "—"}
                      </td>
                      <td style={{ ...styles.td, textAlign: "right", fontWeight: 700, fontSize: 15 }}>
                        {u.total_attendance}
                      </td>
                      <td style={{ ...styles.td, textAlign: "right" }}>
                        {u.month_attendance}
                      </td>
                      <td style={styles.td}>{fmt(u.last_attended_date)}</td>
                      <td style={styles.td}>
                        {u.most_attended_class ? (
                          <span style={{ ...classBadgeColor(u.most_attended_class.class_type), borderRadius: 10, padding: "3px 10px", fontSize: 12 }}>
                            {u.most_attended_class.class_name}
                            <span style={{ marginLeft: 5, opacity: 0.75 }}>×{u.most_attended_class.attendance_count}</span>
                          </span>
                        ) : "—"}
                      </td>
                    </tr>

                    {/* Expanded class breakdown */}
                    {expanded && (
                      <tr>
                        <td colSpan={platform === "zyrax" ? 15 : 14} style={styles.expandedCell}>
                          <div style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: "flex-start" }}>
                            <div>
                              <div style={styles.expandLabel}>Class Attendance Breakdown</div>
                              <ClassBreakdown classes={u.classes_breakdown} />
                            </div>
                            <div>
                              <div style={styles.expandLabel}>Profile Details</div>
                              <div style={{ fontSize: 12, lineHeight: 1.9 }}>
                                <span style={styles.detailKey}>DOB:</span> {fmt(u.date_of_birth)}<br />
                                {u.height && <><span style={styles.detailKey}>Height:</span> {u.height} cm<br /></>}
                                {u.current_weight && <><span style={styles.detailKey}>Weight:</span> {u.current_weight} kg<br /></>}
                                {u.target_weight && <><span style={styles.detailKey}>Target:</span> {u.target_weight} kg<br /></>}
                                <span style={styles.detailKey}>Onboarded:</span> {u.has_completed_onboarding ? "Yes" : "No"}
                              </div>
                            </div>
                            {u.subscription && (
                              <div>
                                <div style={styles.expandLabel}>Subscription Details</div>
                                <div style={{ fontSize: 12, lineHeight: 1.9 }}>
                                  <span style={styles.detailKey}>Txn ID:</span> {u.subscription.transaction_id}<br />
                                  {u.subscription.is_on_hold !== undefined && (
                                    <><span style={styles.detailKey}>On Hold:</span> {u.subscription.is_on_hold ? "Yes" : "No"}<br /></>
                                  )}
                                </div>
                              </div>
                            )}
                            {u.has_used_trial && (
                              <div>
                                <div style={styles.expandLabel}>Trial Info</div>
                                <div style={{ fontSize: 12, lineHeight: 1.9 }}>
                                  <span style={styles.detailKey}>Trial Start:</span> {fmt(u.trial_start_date)}<br />
                                  <span style={styles.detailKey}>Trial End:</span> {fmt(u.trial_end_date)}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 16, color: "#9e9e9e", fontSize: 12 }}>
        Showing {filtered.length} of {users.length} users
      </div>
    </div>
  );
};

// ─── styles ──────────────────────────────────────────────────────────────────

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f6f9",
    padding: "24px 32px",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  title: { margin: 0, fontSize: 26, fontWeight: 700, color: "#1a1a2e" },
  subtitle: { margin: "4px 0 0", color: "#757575", fontSize: 14 },
  backBtn: {
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: 8,
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: 14,
    color: "#333",
  },
  tabs: { display: "flex", gap: 8, marginBottom: 20 },
  tab: {
    padding: "10px 24px",
    borderRadius: 8,
    border: "1px solid #ddd",
    background: "#fff",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
    color: "#555",
  },
  tabActive: {
    background: "#1a1a2e",
    color: "#fff",
    border: "1px solid #1a1a2e",
  },
  cards: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 20,
  },
  card: {
    background: "#fff",
    borderRadius: 10,
    padding: "14px 20px",
    minWidth: 110,
    borderTop: "3px solid #1a1a2e",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  cardNum: { fontSize: 26, fontWeight: 700, color: "#1a1a2e" },
  cardLabel: { fontSize: 12, color: "#757575", marginTop: 2 },
  toolbar: {
    display: "flex",
    gap: 10,
    marginBottom: 16,
    flexWrap: "wrap",
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
    minWidth: 220,
    padding: "9px 14px",
    borderRadius: 8,
    border: "1px solid #ddd",
    fontSize: 14,
    outline: "none",
  },
  select: {
    padding: "9px 14px",
    borderRadius: 8,
    border: "1px solid #ddd",
    fontSize: 14,
    background: "#fff",
    cursor: "pointer",
  },
  exportBtn: {
    padding: "9px 18px",
    borderRadius: 8,
    background: "#2e7d32",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
  },
  refreshBtn: {
    padding: "9px 14px",
    borderRadius: 8,
    background: "#fff",
    border: "1px solid #ddd",
    cursor: "pointer",
    fontSize: 14,
  },
  errorBox: {
    background: "#fce4ec",
    color: "#c62828",
    padding: "12px 16px",
    borderRadius: 8,
    marginBottom: 16,
  },
  loadingBox: {
    textAlign: "center",
    padding: 60,
    color: "#555",
    fontSize: 16,
  },
  spinner: {
    width: 40,
    height: 40,
    border: "4px solid #e0e0e0",
    borderTop: "4px solid #1a1a2e",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    margin: "0 auto",
  },
  tableWrapper: {
    overflowX: "auto",
    borderRadius: 10,
    boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
    background: "#fff",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 13,
  },
  th: {
    padding: "11px 12px",
    background: "#1a1a2e",
    color: "#fff",
    fontWeight: 600,
    whiteSpace: "nowrap",
    borderBottom: "2px solid #333",
    fontSize: 12,
  },
  td: {
    padding: "10px 12px",
    borderBottom: "1px solid #f0f0f0",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  },
  emptyCell: {
    textAlign: "center",
    padding: 40,
    color: "#9e9e9e",
  },
  expandBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 16,
    color: "#555",
    padding: "0 4px",
  },
  expandedCell: {
    padding: "16px 24px",
    background: "#f0f7ff",
    borderBottom: "2px solid #bbdefb",
  },
  expandLabel: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#1565c0",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  detailKey: {
    fontWeight: 600,
    color: "#555",
    marginRight: 4,
  },
};

export default UserDatasheet;
