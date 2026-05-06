import React, { useState, useEffect } from "react";
import "./App.css";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const colors = ["#4f46e5", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4"];

export default function App() {
  const [transactions, setTransactions] = useState(() => {
    return JSON.parse(localStorage.getItem("tx")) || [];
  });

  const [page, setPage] = useState("dashboard");
  const [role, setRole] = useState("admin");
  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState("en");

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [dateFilter, setDateFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    amount: "",
    category: "",
    sub: "",
    type: "expense",
    date: "",
  });

  const text = {
    en: {
      dashboard: "Dashboard",
      today: "Today",
      all: "All",
      calendar: "Calendar",
      add: "Add Expense",
      cancel: "Cancel",
      save: "Save",
    },
    te: {
      dashboard: "డాష్‌బోర్డ్",
      today: "ఈరోజు",
      all: "అన్ని",
      calendar: "క్యాలెండర్",
      add: "ఖర్చు జోడించు",
      cancel: "రద్దు",
      save: "సేవ్",
    },
    hi: {
      dashboard: "डैशबोर्ड",
      today: "आज",
      all: "सभी",
      calendar: "कैलेंडर",
      add: "खर्च जोड़ें",
      cancel: "रद्द करें",
      save: "सेव करें",
    },
  };

  useEffect(() => {
    localStorage.setItem("tx", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    setSearch("");
    setDateFilter("");
    setFromDate("");
    setToDate("");
  }, [page]);

  const today = new Date().toISOString().split("T")[0];
  const todaysTx = transactions.filter((t) => t.date === today);

  const saveTx = () => {
    if (!form.amount || !form.category) return;

    if (editId) {
      setTransactions(
        transactions.map((t) =>
          t.id === editId
            ? { ...form, id: editId, amount: Number(form.amount) }
            : t
        )
      );
      setEditId(null);
    } else {
      setTransactions([
        ...transactions,
        {
          ...form,
          amount: Number(form.amount),
          date: form.date || today,
          id: Date.now(),
        },
      ]);
    }

    setShowForm(false);
    setForm({
      amount: "",
      category: "",
      sub: "",
      type: "expense",
      date: "",
    });
  };

  const deleteTx = (id) => {
    setTransactions(transactions.filter((t) => t.id !== id));
  };

  const editTx = (t) => {
    setForm(t);
    setEditId(t.id);
    setShowForm(true);
  };

  const filtered = transactions
    .filter((t) => {
      return (
        t.category.toLowerCase().includes(search.toLowerCase()) &&
        (!dateFilter || t.date === dateFilter) &&
        (!fromDate || t.date >= fromDate) &&
        (!toDate || t.date <= toDate)
      );
    })
    .sort((a, b) => {
      if (!sortBy) return 0;

      if (sortBy === "amount") {
        return sortOrder === "asc" ? a.amount - b.amount : b.amount - a.amount;
      }

      if (sortBy === "date") {
        return sortOrder === "asc"
          ? new Date(a.date) - new Date(b.date)
          : new Date(b.date) - new Date(a.date);
      }

      return sortOrder === "asc"
        ? a.category.localeCompare(b.category)
        : b.category.localeCompare(a.category);
    });

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((a, b) => a + b.amount, 0);

  const expense = transactions
    .filter((t) => t.type === "expense")
    .reduce((a, b) => a + b.amount, 0);

  const balance = income - expense;

  const categoryData = Object.entries(
    transactions.reduce((acc, t) => {
      if (t.type === "expense") {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
      }
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const trendData = transactions.map((t) => ({
    date: t.date,
    amount: t.type === "expense" ? t.amount : -t.amount,
  }));

  const insight = () => {
    if (categoryData.length === 0) return "💡 No spending data yet";
    const max = [...categoryData].sort((a, b) => b.value - a.value)[0];
    return `💡 Highest spending: ${max.name}`;
  };

  const download = (type, val) => {
    let data = transactions;

    if (type === "date") data = transactions.filter((t) => t.date === val);
    if (type === "month") data = transactions.filter((t) => t.date.startsWith(val));
    if (type === "category") data = transactions.filter((t) => t.category === val);

    const csv = [
      "Date,Amount,Category,Sub,Type",
      ...data.map((t) => `${t.date},${t.amount},${t.category},${t.sub},${t.type}`),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "report.csv";
    a.click();
  };

  const backup = () => {
    const blob = new Blob([JSON.stringify(transactions)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "backup.json";
    a.click();
  };

  const restore = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        setTransactions(JSON.parse(ev.target.result));
      } catch (err) {
        alert("Invalid backup file");
      }
    };
    reader.readAsText(file);
  };

  const categories = ["🍔 Food", "🚗 Travel", "🛍 Shopping", "💡 Bills"];

  return (
    <div className={dark ? "app dark" : "app"}>
      <aside className="sidebar">
        <h3>📥 Download Reports</h3>

        <label>📅 Download by Date</label>
        <input type="date" onChange={(e) => download("date", e.target.value)} />

        <label>📆 Download by Month</label>
        <input type="month" onChange={(e) => download("month", e.target.value)} />

        <label>📂 Download by Category</label>
        <select onChange={(e) => download("category", e.target.value)}>
          <option value="">Select Category</option>
          {[...new Set(transactions.map((t) => t.category))].map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <p className="hint">Download filtered reports</p>

        <hr />

        <button onClick={backup}>💾 Backup</button>
        <input type="file" onChange={restore} />
      </aside>

      <main className="main-content">
        <div className="header">
          <h2>💰 Expense Tracker</h2>

          <div>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="admin">admin</option>
              <option value="viewer">viewer</option>
            </select>

            <select value={lang} onChange={(e) => setLang(e.target.value)}>
              <option value="en">EN</option>
              <option value="te">తెలుగు</option>
              <option value="hi">हिंदी</option>
            </select>

            <button onClick={() => setDark(!dark)}>{dark ? "☀️" : "🌙"}</button>
          </div>
        </div>

        <div className="tabs">
          <button
            className={page === "dashboard" ? "active" : ""}
            onClick={() => setPage("dashboard")}
          >
            {text[lang].dashboard}
          </button>
          <button
            className={page === "today" ? "active" : ""}
            onClick={() => setPage("today")}
          >
            {text[lang].today}
          </button>
          <button
            className={page === "all" ? "active" : ""}
            onClick={() => setPage("all")}
          >
            {text[lang].all}
          </button>
          <button
            className={page === "calendar" ? "active" : ""}
            onClick={() => setPage("calendar")}
          >
            {text[lang].calendar}
          </button>
        </div>

        {!todaysTx.length && <p className="warn">⚠️ Add today's expenses</p>}

        {page === "dashboard" && (
          <>
            <div className="cards">
              <div>Balance ₹{balance}</div>
              <div>Income ₹{income}</div>
              <div>Expense ₹{expense}</div>
            </div>

            <p>{insight()}</p>

            <div className="charts-container">
              <div className="chart-box">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" outerRadius={90}>
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={colors[i % colors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-box">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={trendData}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#4f46e5"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {page === "today" && (
          <div className="today-list">
            {todaysTx.length ? (
              todaysTx.map((t) => (
                <div
                  key={t.id}
                  className={`today-card ${t.type === "income" ? "income" : "expense"}`}
                >
                  <h3>{t.category}</h3>
                  <p>{t.sub || "No subcategory"}</p>
                  <div className="today-amount">
                    {t.type === "income" ? "+" : "-"} ₹{t.amount}
                  </div>
                </div>
              ))
            ) : (
              <p>No transactions for today</p>
            )}
          </div>
        )}

        {page === "all" && (
          <>
            <div className="top-controls">
              <div className="search-box">
                <label>🔍 Search</label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search category"
                />
              </div>

              <div>
                <label>📅 Date</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>

              <div>
                <label>📆 From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              <div>
                <label>📆 To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>

              <div>
                <label>↕ Sort By</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                  <option value="">Sort By</option>
                  <option value="date">Date</option>
                  <option value="amount">Amount</option>
                  <option value="category">Category</option>
                </select>
              </div>

              <div>
                <label>⇅ Order</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="asc">Asc</option>
                  <option value="desc">Desc</option>
                </select>
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Category</th>
                    <th>Sub</th>
                    <th>Type</th>
                    {role === "admin" && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id}>
                      <td>{t.date}</td>
                      <td className={t.type === "income" ? "credit" : "debit"}>
                        {t.type === "income" ? "🟢" : "🔴"} ₹{t.amount}
                      </td>
                      <td>{t.category}</td>
                      <td>{t.sub}</td>
                      <td>{t.type}</td>
                      {role === "admin" && (
                        <td>
                          <button onClick={() => editTx(t)}>✏️</button>
                          <button onClick={() => deleteTx(t.id)}>❌</button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {page === "calendar" && (
          <div className="calendar-list">
            {[...new Set(transactions.map((t) => t.date))].map((d) => (
              <div key={d} className="calendar-day">
                <div className="calendar-date">{d}</div>

                <div className="calendar-items">
                  {transactions
                    .filter((t) => t.date === d)
                    .map((t) => (
                      <div key={t.id} className="calendar-item">
                        <div className="calendar-item-left">
                          <span className="calendar-title">{t.category}</span>
                          <span className="calendar-sub">{t.sub || "No subcategory"}</span>
                        </div>

                        <div
                          className={`calendar-amount ${
                            t.type === "income" ? "income" : "expense"
                          }`}
                        >
                          {t.type === "income" ? "+" : "-"} ₹{t.amount}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {role === "admin" && (
          <button className="floating-btn" onClick={() => setShowForm(true)}>
            ➕ {text[lang].add}
          </button>
        )}

        {showForm && (
          <div className="overlay">
            <div className="form">
              <input
                placeholder="Amount"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />

              <input
                placeholder="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />

              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <input
                placeholder="Subcategory"
                value={form.sub}
                onChange={(e) => setForm({ ...form, sub: e.target.value })}
              />

              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>

              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />

              <button onClick={saveTx}>{text[lang].save}</button>
              <button onClick={() => setShowForm(false)}>
                {text[lang].cancel}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}