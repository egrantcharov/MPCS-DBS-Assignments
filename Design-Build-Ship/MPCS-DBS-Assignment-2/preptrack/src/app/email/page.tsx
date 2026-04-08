'use client';

import { useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { EmailTemplate } from '@/context/types';
import CardShell from '@/components/CardShell';
import { Send, ExternalLink, Mail, Building2, FileText, Plus, Pencil, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const templateCategories = ['Introduction', 'FollowUp', 'ThankYou', 'CatchUp', 'Custom'] as const;

export default function EmailPage() {
  const { state, dispatch } = useAppContext();
  const [to, setTo] = useState('');
  const [toName, setToName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [searchContact, setSearchContact] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Template creation form
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateSubject, setNewTemplateSubject] = useState('');
  const [newTemplateBody, setNewTemplateBody] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState<EmailTemplate['category']>('Custom');

  // Template editing
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editCategory, setEditCategory] = useState<EmailTemplate['category']>('Custom');

  const contactsWithCompany = useMemo(() => {
    return state.contacts.map((contact) => {
      const company = state.companies.find((c) => c.id === contact.companyId);
      return { contact, companyName: company?.name || 'Unknown' };
    });
  }, [state.contacts, state.companies]);

  const filteredDropdown = useMemo(() => {
    if (!searchContact) return contactsWithCompany;
    const q = searchContact.toLowerCase();
    return contactsWithCompany.filter(
      ({ contact, companyName }) =>
        contact.name.toLowerCase().includes(q) ||
        contact.email.toLowerCase().includes(q) ||
        companyName.toLowerCase().includes(q)
    );
  }, [contactsWithCompany, searchContact]);

  const handleSelectContact = (email: string, name: string) => {
    setTo(email);
    setToName(name);
    setSearchContact('');
  };

  const handlePrefillCompose = (email: string, name: string) => {
    setTo(email);
    setToName(name);
    setSubject('');
    setBody('');
    setSelectedTemplateId('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (templateId) {
      const template = state.emailTemplates.find((t) => t.id === templateId);
      if (template) {
        setSubject(template.subject);
        setBody(template.body);
      }
    }
  };

  const handleUseTemplate = (template: EmailTemplate) => {
    setSubject(template.subject);
    setBody(template.body);
    setSelectedTemplateId(template.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateTemplate = () => {
    if (!newTemplateName.trim()) return;
    dispatch({
      type: 'ADD_EMAIL_TEMPLATE',
      payload: {
        id: `tpl-${Date.now()}`,
        name: newTemplateName.trim(),
        subject: newTemplateSubject.trim(),
        body: newTemplateBody.trim(),
        category: newTemplateCategory,
      },
    });
    setNewTemplateName('');
    setNewTemplateSubject('');
    setNewTemplateBody('');
    setNewTemplateCategory('Custom');
    setShowCreateTemplate(false);
  };

  const handleStartEdit = (template: EmailTemplate) => {
    setEditingTemplateId(template.id);
    setEditName(template.name);
    setEditSubject(template.subject);
    setEditBody(template.body);
    setEditCategory(template.category);
  };

  const handleSaveEdit = () => {
    if (!editingTemplateId || !editName.trim()) return;
    dispatch({
      type: 'UPDATE_EMAIL_TEMPLATE',
      payload: {
        id: editingTemplateId,
        name: editName.trim(),
        subject: editSubject.trim(),
        body: editBody.trim(),
        category: editCategory,
      },
    });
    setEditingTemplateId(null);
  };

  const handleDeleteTemplate = (id: string) => {
    dispatch({ type: 'DELETE_EMAIL_TEMPLATE', payload: id });
    if (editingTemplateId === id) setEditingTemplateId(null);
  };

  const gmailComposeUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set('view', 'cm');
    params.set('fs', '1');
    if (to) params.set('to', to);
    if (subject) params.set('su', subject);
    if (body) params.set('body', body);
    return `https://mail.google.com/mail/?${params.toString()}`;
  }, [to, subject, body]);

  const inputClass =
    'w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-indigo-500 transition';

  const categoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      Introduction: 'bg-blue-50 text-blue-700',
      FollowUp: 'bg-amber-50 text-amber-700',
      ThankYou: 'bg-emerald-50 text-emerald-700',
      CatchUp: 'bg-indigo-50 text-indigo-700',
      Custom: 'bg-gray-100 text-gray-600',
    };
    return colors[cat] || colors.Custom;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Email</h1>
        <p className="text-sm text-gray-500">
          Compose and send emails to your contacts via Gmail
        </p>
      </div>

      {/* Compose Section */}
      <CardShell>
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Compose Email</h3>
        <div className="space-y-3">
          {/* Template selector */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Use Template
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => handleSelectTemplate(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-indigo-500 w-full"
            >
              <option value="">No template</option>
              {state.emailTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.category})
                </option>
              ))}
            </select>
          </div>

          {/* To field */}
          <div className="relative">
            <label className="block text-xs text-gray-500 mb-1">To</label>
            {to ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 flex items-center justify-between">
                  <span>
                    {toName} ({to})
                  </span>
                  <button
                    onClick={() => {
                      setTo('');
                      setToName('');
                    }}
                    className="text-gray-400 hover:text-red-600 text-xs ml-2"
                  >
                    Clear
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={searchContact}
                  onChange={(e) => setSearchContact(e.target.value)}
                  placeholder="Search contacts by name, email, or company..."
                  className={inputClass}
                />
                {searchContact && filteredDropdown.length > 0 && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredDropdown.map(({ contact, companyName }) => (
                      <button
                        key={contact.id}
                        onClick={() =>
                          handleSelectContact(contact.email, contact.name)
                        }
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 transition-colors text-sm"
                      >
                        <div>
                          <p className="text-gray-900 font-medium">
                            {contact.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {contact.email} &middot; {companyName}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject..."
              className={inputClass}
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email..."
              className="w-full bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-900 placeholder:text-gray-400 min-h-[120px] outline-none focus:border-indigo-500 transition resize-y"
            />
          </div>

          {/* Send button */}
          <a
            href={gmailComposeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all text-sm font-medium"
          >
            <Send size={14} />
            Send via Gmail
          </a>
        </div>
      </CardShell>

      {/* Templates Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <FileText size={16} className="text-indigo-600" />
            Email Templates
          </h3>
          <button
            onClick={() => setShowCreateTemplate(!showCreateTemplate)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition text-xs font-medium"
          >
            {showCreateTemplate ? <X size={12} /> : <Plus size={12} />}
            {showCreateTemplate ? 'Cancel' : 'New Template'}
          </button>
        </div>

        {state.emailTemplates.length === 0 && !showCreateTemplate ? (
          <CardShell>
            <p className="text-sm text-gray-400 text-center py-4">
              No templates yet. Create one to speed up your outreach.
            </p>
          </CardShell>
        ) : (
          <div className="space-y-3">
            {state.emailTemplates.map((template) =>
              editingTemplateId === template.id ? (
                // Editing mode
                <CardShell key={template.id}>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Template name"
                        className={inputClass}
                      />
                      <select
                        value={editCategory}
                        onChange={(e) =>
                          setEditCategory(
                            e.target.value as EmailTemplate['category']
                          )
                        }
                        className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-indigo-500"
                      >
                        {templateCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="text"
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      placeholder="Subject line"
                      className={inputClass}
                    />
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      placeholder="Template body..."
                      className="w-full bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-900 placeholder:text-gray-400 min-h-[80px] outline-none focus:border-indigo-500 transition resize-y"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveEdit}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition text-xs font-medium"
                      >
                        <Check size={12} />
                        Save
                      </button>
                      <button
                        onClick={() => setEditingTemplateId(null)}
                        className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition text-xs font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </CardShell>
              ) : (
                // Display mode
                <CardShell key={template.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900">
                          {template.name}
                        </p>
                        <span
                          className={cn(
                            'text-xs px-2 py-0.5 rounded-full font-medium',
                            categoryColor(template.category)
                          )}
                        >
                          {template.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Subject: {template.subject || '(no subject)'}
                      </p>
                      {template.body && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                          {template.body}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 ml-3">
                      <button
                        onClick={() => handleUseTemplate(template)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition text-xs font-medium"
                      >
                        Use
                      </button>
                      <button
                        onClick={() => handleStartEdit(template)}
                        className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="p-1.5 rounded-lg bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                </CardShell>
              )
            )}
          </div>
        )}
      </div>

      {/* Create Template Form */}
      {showCreateTemplate && (
        <CardShell>
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            Create Template
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Template name *"
                className={inputClass}
              />
              <select
                value={newTemplateCategory}
                onChange={(e) =>
                  setNewTemplateCategory(
                    e.target.value as EmailTemplate['category']
                  )
                }
                className="bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-indigo-500"
              >
                {templateCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <input
              type="text"
              value={newTemplateSubject}
              onChange={(e) => setNewTemplateSubject(e.target.value)}
              placeholder="Subject line"
              className={inputClass}
            />
            <textarea
              value={newTemplateBody}
              onChange={(e) => setNewTemplateBody(e.target.value)}
              placeholder="Template body..."
              className="w-full bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-900 placeholder:text-gray-400 min-h-[100px] outline-none focus:border-indigo-500 transition resize-y"
            />
            <button
              onClick={handleCreateTemplate}
              disabled={!newTemplateName.trim()}
              className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Create Template
            </button>
          </div>
        </CardShell>
      )}

      {/* Quick Compose Grid */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Quick Compose
        </h3>
        {contactsWithCompany.length === 0 ? (
          <p className="text-sm text-gray-500">No contacts available</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {contactsWithCompany.map(({ contact, companyName }) => (
              <CardShell key={contact.id} className="flex flex-col justify-between">
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-900">
                    {contact.name}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Building2 size={10} />
                    {companyName}
                  </p>
                  {contact.email && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Mail size={10} />
                      {contact.email}
                    </p>
                  )}
                </div>
                <button
                  onClick={() =>
                    handlePrefillCompose(contact.email, contact.name)
                  }
                  disabled={!contact.email}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send size={11} />
                  Compose
                </button>
              </CardShell>
            ))}
          </div>
        )}
      </div>

      {/* Open Gmail */}
      <div className="pt-2">
        <a
          href="https://mail.google.com/mail/u/0/#inbox"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-all text-sm font-medium"
        >
          <ExternalLink size={14} />
          Open Gmail Inbox
        </a>
      </div>
    </div>
  );
}
