import React, { useState } from 'react';
import { Users, Plus, Copy, Check, Trash2, Shield, User as UserIcon } from 'lucide-react';
import {
  getOrgUsers,
  getOrgInviteCodes,
  createOrgInviteCode,
  deleteOrgInviteCode,
  setUserRole,
  removeUserFromOrg,
  getOrganizationById,
} from '../utils/auth';
import { User, OrgInviteCode } from '../types';

interface Props {
  orgId: string;
  currentUserId: string;
}

const UserManager: React.FC<Props> = ({ orgId, currentUserId }) => {
  const org = getOrganizationById(orgId);

  const [users, setUsers] = useState<User[]>(() => getOrgUsers(orgId));
  const [inviteCodes, setInviteCodes] = useState<OrgInviteCode[]>(() => getOrgInviteCodes(orgId));
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const refreshUsers = () => setUsers(getOrgUsers(orgId));
  const refreshCodes = () => setInviteCodes(getOrgInviteCodes(orgId));

  const handleGenerateCode = () => {
    createOrgInviteCode(orgId, currentUserId);
    refreshCodes();
  };

  const handleDeleteCode = (codeId: string) => {
    deleteOrgInviteCode(codeId);
    refreshCodes();
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  const handleToggleRole = (user: User) => {
    const newRole: 'org_admin' | 'user' = user.role === 'org_admin' ? 'user' : 'org_admin';
    setUserRole(user.id, newRole);
    refreshUsers();
  };

  const handleRemoveUser = (userId: string) => {
    removeUserFromOrg(userId);
    setConfirmRemove(null);
    refreshUsers();
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6">
        <Users size={28} style={{ color: 'var(--leaf)' }} />
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--cream)' }}>Manage Users</h1>
          {org && (
            <p className="text-sm" style={{ color: 'var(--leaf)' }}>{org.name}</p>
          )}
        </div>
      </div>

      {/* Invite codes section */}
      <div className="rounded-xl p-4 mb-6" style={{ background: 'var(--surface-raised)' }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold" style={{ color: 'var(--cream)' }}>
            Invite Codes
          </h2>
          <button
            onClick={handleGenerateCode}
            className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg font-medium"
            style={{ background: 'var(--moss)', color: 'var(--cream)' }}
          >
            <Plus size={14} /> Generate New Code
          </button>
        </div>
        <p className="text-xs mb-3" style={{ color: 'var(--leaf)' }}>
          Share these codes with new employees so they can register and join your organization.
        </p>
        {inviteCodes.length === 0 ? (
          <p className="text-sm italic" style={{ color: 'var(--leaf)' }}>
            No invite codes. Generate one above to invite team members.
          </p>
        ) : (
          <div className="space-y-2">
            {inviteCodes.map(ic => (
              <div
                key={ic.id}
                className="flex items-center justify-between py-2 px-3 rounded-lg"
                style={{ background: 'var(--surface)' }}
              >
                <span className="font-mono font-medium" style={{ color: 'var(--cream)' }}>{ic.code}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(ic.code)}
                    className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                    style={{ color: 'var(--leaf)' }}
                    title="Copy to clipboard"
                  >
                    {copiedCode === ic.code
                      ? <><Check size={12} /> Copied</>
                      : <><Copy size={12} /> Copy</>
                    }
                  </button>
                  <button
                    onClick={() => handleDeleteCode(ic.id)}
                    className="p-1 rounded"
                    style={{ color: '#f87171' }}
                    title="Delete invite code"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Users section */}
      <div className="rounded-xl p-4" style={{ background: 'var(--surface-raised)' }}>
        <h2 className="font-semibold mb-3" style={{ color: 'var(--cream)' }}>
          Team Members ({users.length})
        </h2>
        {users.length === 0 ? (
          <p className="text-sm italic" style={{ color: 'var(--leaf)' }}>
            No members yet. Share an invite code to add team members.
          </p>
        ) : (
          <div className="space-y-2">
            {users.map(user => (
              <div key={user.id}>
                <div
                  className="flex items-center justify-between py-3 px-3 rounded-lg"
                  style={{ background: 'var(--surface)' }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: user.role === 'org_admin' ? 'var(--amber)' : 'var(--canopy)' }}
                    >
                      {user.role === 'org_admin'
                        ? <Shield size={14} style={{ color: '#000' }} />
                        : <UserIcon size={14} style={{ color: 'var(--cream)' }} />
                      }
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--cream)' }}>
                        {user.name}
                        {user.id === currentUserId && (
                          <span className="ml-2 text-xs" style={{ color: 'var(--leaf)' }}>(you)</span>
                        )}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--leaf)' }}>{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs px-2 py-1 rounded-full"
                      style={{
                        background: user.role === 'org_admin' ? '#78350f' : 'var(--canopy)',
                        color: user.role === 'org_admin' ? 'var(--amber)' : 'var(--cream)',
                      }}
                    >
                      {user.role === 'org_admin' ? 'Admin' : 'Member'}
                    </span>
                    {user.id !== currentUserId && (
                      <>
                        <button
                          onClick={() => handleToggleRole(user)}
                          className="text-xs px-2 py-1 rounded-lg"
                          style={{ background: 'var(--canopy)', color: 'var(--cream)' }}
                          title={user.role === 'org_admin' ? 'Demote to member' : 'Promote to admin'}
                        >
                          {user.role === 'org_admin' ? 'Demote' : 'Promote'}
                        </button>
                        <button
                          onClick={() => setConfirmRemove(user.id)}
                          className="p-1 rounded"
                          style={{ color: '#f87171' }}
                          title="Remove user"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Confirm remove */}
                {confirmRemove === user.id && (
                  <div
                    className="mt-1 mx-2 px-3 py-2 rounded-lg flex items-center justify-between text-sm"
                    style={{ background: '#7f1d1d', color: '#fca5a5' }}
                  >
                    <span>Remove {user.name} from this organization?</span>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleRemoveUser(user.id)}
                        className="px-3 py-1 rounded font-medium"
                        style={{ background: '#dc2626', color: '#fff' }}
                      >
                        Remove
                      </button>
                      <button
                        onClick={() => setConfirmRemove(null)}
                        className="px-3 py-1 rounded"
                        style={{ background: 'var(--surface)', color: 'var(--cream)' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManager;
