'use client';

import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, LogOut, Users, UserCheck, UserX, FolderGit2, RefreshCw, Plus, Trash2, ToggleLeft, ToggleRight, Mail, Reply, Phone } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

interface AdminStats {
  totalVisitors: number;
  identifiedVisitors: number;
  skippedVisitors: number;
  totalProjects: number;
  databaseStatus: string;
}

interface RoleData {
  role: string;
  count: number;
}

interface VisitorItem {
  _id?: string;
  id?: string;
  name?: string;
  role?: string;
  status: 'identified' | 'skipped';
  ipAddress: string;
  createdAt: string;
}

interface ProjectItem {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  category: string;
  image: string;
  liveUrl?: string;
  githubUrl?: string;
}

interface ContactMessageItem {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  createdAt: string;
}

const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#10b981'];

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [token, setToken] = useState<string>('');

  // Dashboard Data
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [roleData, setRoleData] = useState<RoleData[]>([]);
  const [visitors, setVisitors] = useState<VisitorItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [messages, setMessages] = useState<ContactMessageItem[]>([]);
  const [availableForHire, setAvailableForHire] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loadingData, setLoadingData] = useState<boolean>(false);

  // New Project Form
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Full Stack');
  const [newImage, setNewImage] = useState('https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80');
  const [newTags, setNewTags] = useState('React, Next.js, Node.js');
  const [newLiveUrl, setNewLiveUrl] = useState('#');
  const [newGithubUrl, setNewGithubUrl] = useState('#');

  // Check saved token on mount
  useEffect(() => {
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('admin_jwt_token') : null;
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    if (!token) return;
    setLoadingData(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, roleRes, visitorsRes, projectsRes, statusRes, messagesRes] = await Promise.all([
        fetch('/api/admin/stats', { headers }),
        fetch('/api/admin/role-distribution', { headers }),
        fetch(`/api/admin/visitors?page=${page}&limit=20`, { headers }),
        fetch('/api/projects'),
        fetch('/api/status'),
        fetch('/api/admin/messages', { headers }),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (roleRes.ok) setRoleData(await roleRes.json());
      if (visitorsRes.ok) {
        const vData = await visitorsRes.json();
        setVisitors(vData.visitors || []);
        setTotalPages(vData.totalPages || 1);
      }
      if (projectsRes.ok) setProjects(await projectsRes.json());
      if (statusRes.ok) {
        const sData = await statusRes.json();
        setAvailableForHire(sData.availableForHire);
      }
      if (messagesRes.ok) {
        const mData = await messagesRes.json();
        setMessages(mData.messages || []);
      }
    } catch (err) {
      console.error('Error fetching admin metrics:', err);
    } finally {
      setLoadingData(false);
    }
  }, [token, page]);

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    try {
      await fetch(`/api/admin/messages?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDashboardData();
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, fetchDashboardData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('admin_jwt_token', data.token);
        setToken(data.token);
        setIsAuthenticated(true);
      } else {
        setLoginError(data.message || 'Authentication failed');
      }
    } catch {
      setLoginError('Server error during login.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_jwt_token');
    setToken('');
    setIsAuthenticated(false);
  };

  const handleToggleStatus = async () => {
    const nextStatus = !availableForHire;
    setAvailableForHire(nextStatus);
    try {
      await fetch('/api/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ availableForHire: nextStatus }),
      });
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          category: newCategory,
          image: newImage,
          tags: newTags.split(',').map((t) => t.trim()),
          liveUrl: newLiveUrl,
          githubUrl: newGithubUrl,
        }),
      });

      if (res.ok) {
        setNewTitle('');
        setNewDesc('');
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Project creation failed:', err);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    try {
      await fetch(`/api/admin/projects/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDashboardData();
    } catch (err) {
      console.error('Delete project failed:', err);
    }
  };

  // 1. Unauthenticated State (Login Screen)
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Admin Control Gate</h2>
              <p className="text-xs text-slate-400">Enter JWT credentials to access dashboard.</p>
            </div>
          </div>

          {loginError && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@portfolio.com"
                required
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-700 focus:border-blue-500 rounded-xl text-sm text-white focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/20 transition-all"
            >
              Sign In to Admin Panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Authenticating...
      </div>
    );
  }

  // 2. Authenticated Admin Dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-slate-900/80 border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-white">Visitor Analytics &amp; Control</h1>
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                  Verified Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">Live MongoDB analytics stream &amp; content management</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Status Toggle Switch */}
            <button
              onClick={handleToggleStatus}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl text-xs font-semibold text-slate-200 transition-colors"
            >
              Status Badge:
              {availableForHire ? (
                <span className="flex items-center gap-1 text-emerald-400">
                  <ToggleRight className="w-5 h-5" /> Open to Opportunities
                </span>
              ) : (
                <span className="flex items-center gap-1 text-slate-400">
                  <ToggleLeft className="w-5 h-5" /> Busy / Closed
                </span>
              )}
            </button>

            <button
              onClick={fetchDashboardData}
              className="p-2.5 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"
              title="Refresh Metrics"
            >
              <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 font-semibold text-xs rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Exit Admin
            </button>
          </div>
        </div>

        {/* Live Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Total Visitors</p>
              <h3 className="text-3xl font-black text-white mt-1">{stats?.totalVisitors ?? 0}</h3>
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>

          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Identified</p>
              <h3 className="text-3xl font-black text-emerald-400 mt-1">{stats?.identifiedVisitors ?? 0}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Skipped</p>
              <h3 className="text-3xl font-black text-amber-400 mt-1">{stats?.skippedVisitors ?? 0}</h3>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
              <UserX className="w-6 h-6" />
            </div>
          </div>

          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-400">Total Projects</p>
              <h3 className="text-3xl font-black text-indigo-400 mt-1">{stats?.totalProjects ?? 0}</h3>
            </div>
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
              <FolderGit2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Role Distribution Chart Section */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-lg font-bold text-white">Role Distribution</h3>

          {roleData.length === 0 ? (
            <div className="h-48 flex items-center justify-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-sm">
              No role data available yet.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roleData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <XAxis dataKey="role" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {roleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Visitor Log Table */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Visitor Log Table</h3>
            <span className="text-xs text-slate-400">Page {page} of {totalPages}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {visitors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-500">
                      No visitors recorded yet.
                    </td>
                  </tr>
                ) : (
                  visitors.map((v, index) => (
                    <tr key={v._id || v.id || `vis-${index}`} className="hover:bg-slate-800/40">
                      <td className="p-3 font-semibold text-white">{v.name || 'Anonymous'}</td>
                      <td className="p-3 text-slate-300">{v.role || '—'}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                            v.status === 'identified'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-400">{v.ipAddress}</td>
                      <td className="p-3 text-slate-400">
                        {new Date(v.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs disabled:opacity-40"
            >
              Previous
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>

        {/* Contact Form Submissions / Inbound Mails */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600/20 border border-blue-500/30 rounded-xl text-blue-400">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Inbound Contact Messages & Mails</h3>
                <p className="text-xs text-slate-400">Received contact form submissions from portfolio visitors</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono text-xs font-semibold rounded-full">
              {messages.length} Messages
            </span>
          </div>

          {messages.length === 0 ? (
            <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-400 text-sm">
              No contact messages received yet. Submit the contact form on your portfolio website to test!
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((m, index) => (
                <div key={m.id || `msg-${index}`} className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3 relative group hover:border-blue-500/40 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{m.name}</span>
                      <span className="text-xs text-blue-400 font-mono">({m.email})</span>
                      {m.phone && (
                        <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-slate-500" /> {m.phone}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(m.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {m.subject && (
                    <p className="text-xs font-semibold text-purple-300">
                      Subject: <span className="text-slate-200">{m.subject}</span>
                    </p>
                  )}

                  <div className="p-3 bg-slate-900/80 rounded-lg text-xs text-slate-300 white-space-pre-wrap leading-relaxed border border-slate-800/60">
                    {m.message}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <a
                      href={`mailto:${m.email}?subject=${encodeURIComponent(m.subject ? `Re: ${m.subject}` : 'Re: Portfolio Contact Inquiry')}`}
                      className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Reply className="w-3.5 h-3.5" /> Reply Email
                    </a>
                    <button
                      onClick={() => handleDeleteMessage(m.id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="Delete Message"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Projects Management */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
          <h3 className="text-lg font-bold text-white">Project Manager</h3>

          {/* Add Project Form */}
          <form onSubmit={handleAddProject} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase">Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Project Name"
                required
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase">Category</label>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Full Stack / AI & ML"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase">Description</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Brief summary of the project"
                required
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase">Image URL</label>
              <input
                type="text"
                value={newImage}
                onChange={(e) => setNewImage(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase">Tags (comma separated)</label>
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase">Live URL</label>
              <input
                type="text"
                value={newLiveUrl}
                onChange={(e) => setNewLiveUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 uppercase">GitHub URL</label>
              <input
                type="text"
                value={newGithubUrl}
                onChange={(e) => setNewGithubUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-500/20"
              >
                <Plus className="w-4 h-4" /> Add Project
              </button>
            </div>
          </form>

          {/* Project List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((p, index) => {
              const projKey = p._id || p.id || `proj-${index}`;
              const targetId = p._id || p.id || '';
              return (
                <div key={projKey} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-blue-400">{p.category}</span>
                    <h4 className="text-sm font-bold text-white">{p.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteProject(targetId)}
                    className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Delete Project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
