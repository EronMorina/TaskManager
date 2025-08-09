import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from 'react';
const STATUS_OPTIONS = ['todo', 'in_progress', 'done'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high'];
async function api(path, init) {
    const res = await fetch(path, {
        headers: { 'Content-Type': 'application/json' },
        ...init,
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || res.statusText);
    }
    return res.json();
}
export function App() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('todo');
    const [priority, setPriority] = useState('medium');
    const [dueDate, setDueDate] = useState('');
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    useEffect(() => {
        (async () => {
            try {
                const data = await api('/api/tasks');
                setTasks(data);
            }
            catch (e) {
                setError(e.message);
            }
            finally {
                setLoading(false);
            }
        })();
    }, []);
    const filtered = useMemo(() => {
        return tasks.filter((t) => {
            if (filterStatus && t.status !== filterStatus)
                return false;
            if (filterPriority && t.priority !== filterPriority)
                return false;
            if (search) {
                const s = search.toLowerCase();
                if (!(`${t.title} ${t.description ?? ''}`.toLowerCase().includes(s)))
                    return false;
            }
            return true;
        });
    }, [tasks, search, filterStatus, filterPriority]);
    async function handleAddTask(e) {
        e.preventDefault();
        setError(null);
        try {
            const payload = {
                title: title.trim(),
                description: description.trim() || undefined,
                status,
                priority,
                dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
            };
            const created = await api('/api/tasks', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
            setTasks((prev) => [created, ...prev]);
            setTitle('');
            setDescription('');
            setStatus('todo');
            setPriority('medium');
            setDueDate('');
        }
        catch (e) {
            setError(e.message);
        }
    }
    async function toggleStatus(task) {
        const next = task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'todo';
        try {
            const updated = await api(`/api/tasks/${task.id}`, {
                method: 'PUT',
                body: JSON.stringify({ status: next }),
            });
            setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
        }
        catch (e) {
            setError(e.message);
        }
    }
    async function deleteTask(taskId) {
        try {
            await api(`/api/tasks/${taskId}`, { method: 'DELETE' });
            setTasks((prev) => prev.filter((t) => t.id !== taskId));
        }
        catch (e) {
            setError(e.message);
        }
    }
    return (_jsxs("div", { className: "container", children: [_jsx("header", { children: _jsx("h1", { children: "Task Management" }) }), _jsx("section", { className: "panel", children: _jsxs("form", { onSubmit: handleAddTask, className: "form-grid", children: [_jsx("input", { placeholder: "Task title", value: title, onChange: (e) => setTitle(e.target.value), required: true }), _jsx("input", { placeholder: "Description (optional)", value: description, onChange: (e) => setDescription(e.target.value) }), _jsx("select", { value: status, onChange: (e) => setStatus(e.target.value), children: STATUS_OPTIONS.map((s) => (_jsx("option", { value: s, children: s }, s))) }), _jsx("select", { value: priority, onChange: (e) => setPriority(e.target.value), children: PRIORITY_OPTIONS.map((p) => (_jsx("option", { value: p, children: p }, p))) }), _jsx("input", { type: "datetime-local", value: dueDate, onChange: (e) => setDueDate(e.target.value) }), _jsx("button", { type: "submit", children: "Add Task" })] }) }), _jsx("section", { className: "panel", children: _jsxs("div", { className: "filters", children: [_jsx("input", { placeholder: "Search...", value: search, onChange: (e) => setSearch(e.target.value) }), _jsxs("select", { value: filterStatus, onChange: (e) => setFilterStatus(e.target.value), children: [_jsx("option", { value: "", children: "All statuses" }), STATUS_OPTIONS.map((s) => (_jsx("option", { value: s, children: s }, s)))] }), _jsxs("select", { value: filterPriority, onChange: (e) => setFilterPriority(e.target.value), children: [_jsx("option", { value: "", children: "All priorities" }), PRIORITY_OPTIONS.map((p) => (_jsx("option", { value: p, children: p }, p)))] })] }) }), error && _jsx("div", { className: "error", children: error }), loading ? (_jsx("div", { className: "empty", children: "Loading..." })) : filtered.length === 0 ? (_jsx("div", { className: "empty", children: "No tasks yet" })) : (_jsx("ul", { className: "tasks", children: filtered.map((t) => (_jsxs("li", { className: `task ${t.status}`, children: [_jsxs("div", { className: "task-main", children: [_jsx("div", { className: "title", children: t.title }), t.description && _jsx("div", { className: "desc", children: t.description }), _jsxs("div", { className: "meta", children: [_jsx("span", { className: `badge ${t.priority}`, children: t.priority }), _jsx("span", { className: "muted", children: new Date(t.createdAt).toLocaleString() }), t.dueDate && _jsxs("span", { className: "muted", children: ["Due ", new Date(t.dueDate).toLocaleString()] })] })] }), _jsxs("div", { className: "task-actions", children: [_jsx("button", { onClick: () => toggleStatus(t), children: "Next Status" }), _jsx("button", { className: "danger", onClick: () => deleteTask(t.id), children: "Delete" })] })] }, t.id))) }))] }));
}
