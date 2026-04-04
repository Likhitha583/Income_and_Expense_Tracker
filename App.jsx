import React, { useState, useEffect } from "react";
import "./App.css";
import {
  PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

const colors = ["#4f46e5","#22c55e","#f59e0b","#ef4444","#06b6d4"];

export default function App() {

  const [transactions, setTransactions] = useState(
    () => JSON.parse(localStorage.getItem("tx")) || []
  );

  const [page, setPage] = useState("dashboard");
  const [role, setRole] = useState("admin");
  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState("en");

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    amount:"", category:"", sub:"", type:"expense", date:""
  });

  const text = {
    en:{dashboard:"Dashboard",today:"Today",all:"All",calendar:"Calendar",add:"Add Expense",cancel:"Cancel"},
    te:{dashboard:"డాష్‌బోర్డ్",today:"ఈరోజు",all:"అన్ని",calendar:"క్యాలెండర్",add:"ఖర్చు జోడించు",cancel:"రద్దు"},
    hi:{dashboard:"डैशबोर्ड",today:"आज",all:"सभी",calendar:"कैलेंडर",add:"खर्च जोड़ें",cancel:"रद्द करें"}
  };

  useEffect(()=>{
    localStorage.setItem("tx", JSON.stringify(transactions));
  },[transactions]);

  useEffect(()=>{
    setSearch(""); setDateFilter(""); setFromDate(""); setToDate("");
  },[page]);

  const today = new Date().toISOString().split("T")[0];
  const todaysTx = transactions.filter(t => t.date === today);

  const saveTx = () => {
    if(editId){
      setTransactions(transactions.map(t =>
        t.id === editId ? {...form, id:editId, amount:Number(form.amount)} : t
      ));
      setEditId(null);
    } else {
      setTransactions([...transactions,{
        ...form,
        amount:Number(form.amount),
        date: form.date || today,
        id:Date.now()
      }]);
    }
    setShowForm(false);
    setForm({amount:"",category:"",sub:"",type:"expense",date:""});
  };

  const deleteTx = id => setTransactions(transactions.filter(t=>t.id!==id));
  const editTx = t => { setForm(t); setEditId(t.id); setShowForm(true); };

  const filtered = transactions.filter(t=>{
    return (
      t.category.toLowerCase().includes(search.toLowerCase()) &&
      (!dateFilter || t.date===dateFilter) &&
      (!fromDate || t.date>=fromDate) &&
      (!toDate || t.date<=toDate)
    );
  });

  const income = transactions.filter(t=>t.type==="income").reduce((a,b)=>a+b.amount,0);
  const expense = transactions.filter(t=>t.type==="expense").reduce((a,b)=>a+b.amount,0);

  const categoryData = Object.entries(
    transactions.reduce((acc,t)=>{
      if(t.type==="expense") acc[t.category]=(acc[t.category]||0)+t.amount;
      return acc;
    },{})
  ).map(([name,value])=>({name,value}));

  const subData = Object.entries(
    transactions.reduce((acc,t)=>{
      if(t.type==="expense")
        acc[t.sub || "Others"]=(acc[t.sub||"Others"]||0)+t.amount;
      return acc;
    },{})
  ).map(([name,value])=>({name,value}));

  const trendData = transactions.map(t=>({
    date:t.date,
    amount:t.type==="expense"?t.amount:-t.amount
  }));

  const insight = () => {
    if(categoryData.length===0) return "No data yet";
    const max = [...categoryData].sort((a,b)=>b.value-a.value)[0];
    return `💡 Highest spending: ${max.name}`;
  };

  const download = (type,val)=>{
    let data = transactions;
    if(type==="date") data = transactions.filter(t=>t.date===val);
    if(type==="month") data = transactions.filter(t=>t.date.startsWith(val));
    if(type==="category") data = transactions.filter(t=>t.category===val);

    const csv = ["Date,Amount,Category,Sub,Type",
      ...data.map(t=>`${t.date},${t.amount},${t.category},${t.sub},${t.type}`)
    ].join("\n");

    const blob = new Blob([csv]);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download="report.csv";
    a.click();
  };

  const backup = ()=>{
    const blob = new Blob([JSON.stringify(transactions)]);
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download="backup.json";
    a.click();
  };

  const restore = e=>{
    const file=e.target.files[0];
    const reader=new FileReader();
    reader.onload=ev=>{
      setTransactions(JSON.parse(ev.target.result));
    };
    reader.readAsText(file);
  };

  const categories = ["🍔 Food","🚗 Travel","🛍 Shopping","💡 Bills"];

  return (
    <div className={dark?"app dark":"app"}>

      {/* SIDEBAR */}
      <div className="sidebar">
        <h3>📥 Download Reports</h3>

        <label>📅 Download by Date</label>
        <input type="date" onChange={e=>download("date",e.target.value)} />

        <label>📆 Download by Month</label>
        <input type="month" onChange={e=>download("month",e.target.value)} />

        <label>📂 Download by Category</label>
        <select onChange={e=>download("category",e.target.value)}>
          <option>Select Category</option>
          {[...new Set(transactions.map(t=>t.category))].map(c=>
            <option key={c}>{c}</option>
          )}
        </select>

        <p className="hint">Download filtered reports</p>

        <hr/>

        <button onClick={backup}>💾 Backup</button>
        <input type="file" onChange={restore}/>
      </div>

      <div className="main">

        <div className="top">
          <h2>💰 Expense Tracker</h2>

          <div>
            <select onChange={e=>setRole(e.target.value)}>
              <option>admin</option>
              <option>viewer</option>
            </select>

            <select onChange={e=>setLang(e.target.value)}>
              <option value="en">EN</option>
              <option value="te">తెలుగు</option>
              <option value="hi">हिंदी</option>
            </select>

            <button onClick={()=>setDark(!dark)}>🌙</button>
          </div>
        </div>

        <div className="nav">
          <button onClick={()=>setPage("dashboard")}>{text[lang].dashboard}</button>
          <button onClick={()=>setPage("today")}>{text[lang].today}</button>
          <button onClick={()=>setPage("all")}>{text[lang].all}</button>
          <button onClick={()=>setPage("calendar")}>{text[lang].calendar}</button>
        </div>

        {!todaysTx.length && <p className="warn">⚠️ Add today's expenses</p>}

        {page==="dashboard" && (
          <>
            <div className="cards">
              <div>Balance ₹{income-expense}</div>
              <div>Income ₹{income}</div>
              <div>Expense ₹{expense}</div>
            </div>

            <p>{insight()}</p>

            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryData} dataKey="value">
                  {categoryData.map((_,i)=>
                    <Cell key={i} fill={colors[i%colors.length]}/>
                  )}
                </Pie>
                <Tooltip/>
              </PieChart>
            </ResponsiveContainer>

            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={trendData}>
                <XAxis dataKey="date"/>
                <YAxis/>
                <Tooltip/>
                <Line dataKey="amount" stroke="#4f46e5"/>
              </LineChart>
            </ResponsiveContainer>
          </>
        )}

        {page==="today" &&
          todaysTx.map(t=>(
            <div key={t.id}>{t.category} ₹{t.amount}</div>
          ))
        }

        {page==="all" && (
          <>
            <div className="filters">
              <div>
                <label>🔍 Search</label>
                <input value={search} onChange={e=>setSearch(e.target.value)} />
              </div>
              <div>
                <label>📅 Date</label>
                <input type="date" onChange={e=>setDateFilter(e.target.value)} />
              </div>
              <div>
                <label>📆 Range</label>
                <input type="date" onChange={e=>setFromDate(e.target.value)} />
                <input type="date" onChange={e=>setToDate(e.target.value)} />
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Amount</th><th>Category</th><th>Sub</th><th>Type</th>
                  {role==="admin" && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(t=>(
                  <tr key={t.id}>
                    <td>{t.date}</td>
                    <td>{t.amount}</td>
                    <td>{t.category}</td>
                    <td>{t.sub}</td>
                    <td>{t.type}</td>
                    {role==="admin" &&
                      <td>
                        <button onClick={()=>editTx(t)}>✏️</button>
                        <button onClick={()=>deleteTx(t.id)}>❌</button>
                      </td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {page==="calendar" &&
          [...new Set(transactions.map(t=>t.date))].map(d=>(
            <div key={d} className="card">
              <b>{d}</b>
              {transactions.filter(t=>t.date===d).map(t=>
                <p key={t.id}>{t.category} ₹{t.amount}</p>
              )}
            </div>
          ))
        }

        {role==="admin" &&
          <button className="fab" onClick={()=>setShowForm(true)}>
            ➕ {text[lang].add}
          </button>
        }

        {showForm && (
          <div className="popup">
            <div className="form">
              <input placeholder="Amount" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/>
              <input placeholder="Category" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}/>
              <select onChange={e=>setForm({...form,category:e.target.value})}>
                {categories.map(c=><option key={c}>{c}</option>)}
              </select>
              <input placeholder="Subcategory" value={form.sub} onChange={e=>setForm({...form,sub:e.target.value})}/>
              <select onChange={e=>setForm({...form,type:e.target.value})}>
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
              <button onClick={saveTx}>Save</button>
              <button onClick={()=>setShowForm(false)}>{text[lang].cancel}</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}