import React, { useState } from 'react';
import { Building2, Plus, Users, ToggleLeft, ToggleRight, ChevronLeft, Copy, Check } from 'lucide-react';
import {
  loadOrganizations,
  createOrganization,
  setOrganizationActive,
  getOrgUsers,
  createOrgInviteCode,
  getOrgInviteCodes,
  deleteOrgInviteCode,
} from '../utils/auth';
import { Organization, OrgInviteCode } from '../types';

interface Props {
  currentUserId: string;
}

const OrganizationManager: React.FC<Props> = ({ currentUserId }) => {
  const [orgs, setOrgs] = useState<Organization[]>(() => loadOrganizations());
  const [newOrgName, setNewOrgName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [inviteCodes, setInviteCodes] = useState<OrgInviteCode[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const refresh = () => setOrgs(loadOrganizations());

  const handleCreateOrg = () => {
    const name = newOrgName.trim();
    if (!name) {
      setError('Please enter an organization name.');
      return;
    }
    try {
      createOrganization(name);
      setNewOrgName('');
      setCreating(false);
      setError('');
      refresh();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleToggleActive = (orgId: string, active: boolean) => {
    setOrganizationActive(orgId, !active);
    refresh();
    if (selectedOrg?.id === orgId) {
      setSelectedOrg(prev => prev ? { ...prev, active: !active } : null);
    }
  };

  const handleSelectOrg = (org: Organization) => {
    setSelectedOrg(org);
    setInviteCodes(getOrgInviteCodes(org.id));
  };

  const handleGenerateCode = () => {
    if (!selectedOrg) return;
    createOrgInviteCode(selectedOrg.id, currentUserId);
    setInviteCodes(getOrgInviteCodes(selectedOrg.id));
  };

  const handleDeleteCode = (codeId: string) => {
    deleteOrgInviteCode(codeId);
    if (selectedOrg) setInviteCodes(getOrgInviteCodes(selectedOrg.id));
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  // ── Drill-down: org detail view ─────────────────────────────────────────────
  if (selectedOrg) {
    const users = getOrgUsers(selectedOrg.id);
    return (
      <div className="p-4 md:p-6">
        <button
          onClick={() => setSelectedOrg(null)}
          className="flex items-center gap-2 text-sm mb-6"
          style={{ color: 'var(--leaf)' }}
        >
          <ChevronLeft size={16} /> Back to Organizations
        </button>

        <div className="flex items-center gap-3 mb-6">
          <Building2 size={24} style={{ color: 'var(--leaf)' }} />
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--cream)' }}>
              {selectedOrg.name}
            </h2>
            <p className="text-sm" style={{ color: 'var(--leaf)' }}>
              /{selectedOrg.slug} &bull; {selectedOrg.active ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>

        {/* Users */}
        <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--surface-raised)' }}>
          <h3 className="font-semibold mb-3" style={{ color: 'var(--cream)' }}>
            Users ({users.length})
          </h3>
          {users.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--leaf)' }}>No users yet.</p>
          ) : (
            <div className="space-y-2">
              {users.map(u => (
                <div
                  key={u.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg"
                  style={{ background: 'var(--surface)' }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--cream)' }}>{u.name}</p>
                    <p className="text-xs" style={{ color: 'var(--leaf)' }}>{u.email}</p>
                  </div>
                  <span
                    className="text-xs px-2 py-1 rounded-full"
                    style={{
                      background: u.role === 'org_admin' ? 'var(--amber)' : 'var(--canopy)',
                      color: u.role === 'org_admin' ? '#000' : 'var(--cream)',
                    }}
                  >
                    {u.role === 'org_admin' ? 'Org Admin' : 'Member'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Invite codes */}
        <div className="rounded-xl p-4" style={{ background: 'var(--surface-raised)' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold" style={{ color: 'var(--cream)' }}>
              Invite Codes ({inviteCodes.length})
            </h3>
            <button
              onClick={handleGenerateCode}
              className="flex items-center gap-1 text-sm px-3 py-1 rounded-lg"
              style={{ background: 'var(--canopy)', color: 'var(--cream)' }}
            >
              <Plus size={14} /> Generate
            </button>
          </div>
          {inviteCodes.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--leaf)' }}>No invite codes. Generate one to invite users.</p>
          ) : (
            <div className="space-y-2">
              {inviteCodes.map(ic => (
                <div
                  key={ic.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg"
                  style={{ background: 'var(--surface)' }}
                >
                  <span className="font-mono text-sm" style={{ color: 'var(--cream)' }}>{ic.code}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopy(ic.code)}
                      className="p-1 rounded"
                      style={{ color: 'var(--leaf)' }}
                      title="Copy code"
                    >
                      {copiedCode === ic.code ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                    <button
                      onClick={() => handleDeleteCode(ic.id)}
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ background: '#7f1d1d', color: '#fca5a5' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Main org list ───────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Building2 size={28} style={{ color: 'var(--leaf)' }} />
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--cream)' }}>Organizations</h1>
            <p className="text-sm" style={{ color: 'var(--leaf)' }}>Manage all organizations on this platform</p>
          </div>
        </div>
        <button
          onClick={() => { setCreating(true); setError(''); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium"
          style={{ background: 'var(--moss)', color: 'var(--cream)' }}
        >
          <Plus size={18} /> New Organization
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--surface-raised)', border: '1px solid var(--canopy)' }}>
          <h3 className="font-semibold mb-3" style={{ color: 'var(--cream)' }}>Create Organization</h3>
          {error && (
            <p className="text-sm mb-2 px-3 py-2 rounded-lg" style={{ background: '#7f1d1d', color: '#fca5a5' }}>{error}</p>
          )}
          <div className="flex gap-3">
            <input
              type="text"
              value={newOrgName}
              onChange={e => setNewOrgName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateOrg()}
              placeholder="e.g. Smith Arborists"
              className="flex-1 px-3 py-2 rounded-lg text-sm"
              style={{ background: 'var(--surface)', color: 'var(--cream)', border: '1px solid var(--canopy)' }}
              autoFocus
            />
            <button
              onClick={handleCreateOrg}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--moss)', color: 'var(--cream)' }}
            >
              Create
            </button>
            <button
              onClick={() => { setCreating(false); setError(''); setNewOrgName(''); }}
              className="px-4 py-2 rounded-lg text-sm"
              style={{ background: 'var(--surface)', color: 'var(--leaf)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Org list */}
      {orgs.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--leaf)' }}>
          <Building2 size={48} className="mx-auto mb-4 opacity-40" />
          <p>No organizations yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orgs.map(org => {
            const userCount = getOrgUsers(org.id).length;
            return (
              <div
                key={org.id}
                className="rounded-xl p-4 flex items-center justify-between"
                style={{ background: 'var(--surface-raised)' }}
              >
                <button
                  className="flex items-center gap-3 flex-1 text-left"
                  onClick={() => handleSelectOrg(org)}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: org.active ? 'var(--canopy)' : 'var(--surface)' }}
                  >
                    <Building2 size={18} style={{ color: org.active ? 'var(--cream)' : 'var(--leaf)' }} />
                  </div>
                  <div>
                    <p className="font-medium" style={{ color: 'var(--cream)' }}>{org.name}</p>
                    <p className="text-xs" style={{ color: 'var(--leaf)' }}>
                      /{org.slug} &bull; <Users size={10} className="inline" /> {userCount} user{userCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </button>

                <div className="flex items-center gap-3 ml-4">
                  <span
                    className="text-xs px-2 py-1 rounded-full"
                    style={{
                      background: org.active ? '#14532d' : '#3f3f46',
                      color: org.active ? '#86efac' : '#a1a1aa',
                    }}
                  >
                    {org.active ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    onClick={() => handleToggleActive(org.id, org.active)}
                    title={org.active ? 'Deactivate' : 'Activate'}
                    style={{ color: org.active ? 'var(--leaf)' : '#71717a' }}
                  >
                    {org.active
                      ? <ToggleRight size={22} />
                      : <ToggleLeft size={22} />
                    }
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrganizationManager;
