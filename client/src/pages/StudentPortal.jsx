import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Download,
  Link as LinkIcon,
  Check,
  Building2,
  CalendarDays,
  Share2,
  ShieldCheck,
  ShieldAlert,
  Layers,
  BadgeCheck,
  Landmark,
  ChevronDown,
  Hash,
  Eye,
  GraduationCap,
  Lock,
  Plus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import FormField from '../components/FormField';
import StatusBadge from '../components/StatusBadge';
import HashChip from '../components/HashChip';
import Spinner from '../components/Spinner';
import ShareProfileModal from '../components/ShareProfileModal';
import CredentialDNA from '../components/CredentialDNA';
import VerificationProofModal from '../components/VerificationProofModal';
import CredentialGraph from '../components/CredentialGraph';
import AcademicJourney from '../components/AcademicJourney';
import { getMyCredentials, studentLogin, studentRegister } from '../lib/api';
import { downloadCertificatePdf, downloadVerifiedResumePdf } from '../lib/generateCertificatePdf';
import {
  buildStudentProfile,
  groupCredentialsByYear,
  buildProfileUrl,
  getInitials,
  studentIdLabel,
} from '../lib/studentProfile';

export default function StudentPortal() {
  const { student } = useAuth();
  return student ? <StudentDashboard student={student} /> : <StudentLogin />;
}

// ---- Student sign-in / sign-up ----------------------------------------------

function StudentLogin() {
  const { studentSignIn } = useAuth();
  const { notify } = useToast();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isRegister = mode === 'register';

  const switchMode = () => {
    setMode(isRegister ? 'login' : 'register');
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (isRegister && !name.trim()) {
      setError('Enter your full name.');
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError('Enter both your email and password.');
      return;
    }
    if (isRegister && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const signedIn = isRegister
        ? await studentRegister({ name, email, password })
        : await studentLogin(email, password);
      notify(isRegister ? `Welcome, ${signedIn.name}! Your account is ready.` : `Welcome back, ${signedIn.name}.`, 'success');
      studentSignIn(signedIn);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="bg-card border border-border rounded-lg card-shadow p-7">
          <div className="w-11 h-11 rounded-lg bg-teal-soft flex items-center justify-center mb-4">
            <GraduationCap size={22} className="text-teal" />
          </div>
          <p className="text-[11px] font-semibold tracking-[0.12em] text-teal uppercase mb-1">
            Student Portal
          </p>
          <h1 className="text-lg font-semibold mb-1">
            {isRegister ? 'Create your student account' : 'Sign in to your Academic Passport'}
          </h1>
          <p className="text-sm text-ink-soft mb-6">
            {isRegister
              ? 'One account for all your credentials — from every college or university you study at. Use the email you gave your institutions.'
              : 'Sign in with your email to see the verified credentials issued to you by every institution.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegister && (
              <FormField
                label="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ananya Sharma"
              />
            )}
            <FormField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              hint={isRegister ? 'Your institutions issue credentials to this email.' : undefined}
            />
            <FormField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              hint={isRegister ? 'At least 6 characters. Stored securely as a bcrypt hash.' : undefined}
            />
            {isRegister && (
              <FormField
                label="Confirm password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            )}
            {error && <p className="text-xs text-invalid">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-teal text-white text-sm font-medium rounded-md py-2.5 hover:bg-teal/90 transition-colors disabled:opacity-60"
            >
              {loading ? <Spinner size={15} /> : isRegister ? <Plus size={15} /> : <Lock size={15} />}
              {loading
                ? isRegister
                  ? 'Creating account…'
                  : 'Signing in…'
                : isRegister
                ? 'Create account'
                : 'Sign in'}
            </button>
          </form>

          <p className="text-xs text-ink-soft text-center mt-5">
            {isRegister ? 'Already have an account?' : 'First time here?'}{' '}
            <button type="button" onClick={switchMode} className="text-teal font-medium hover:underline">
              {isRegister ? 'Sign in' : 'Create your account'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ---- Dashboard ----------------------------------------------------------------

function StudentDashboard({ student }) {
  const { studentLogout } = useAuth();
  const { notify } = useToast();
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    getMyCredentials()
      .then(setCredentials)
      .catch((err) => {
        notify(err.message, 'error');
        if (err.status === 401) studentLogout();
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notify]);

  const signOutBar = (
    <div className="flex items-center justify-between gap-4">
      <p className="text-xs text-ink-soft">
        Signed in as <span className="font-medium text-ink">{student.name}</span>
        <span> · {student.email}</span>
      </p>
      <button
        onClick={studentLogout}
        className="text-sm text-ink-soft hover:text-ink border border-border rounded-md px-3 py-1.5 shrink-0"
      >
        Sign out
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-5 py-16 flex justify-center text-ink-soft">
        <Spinner size={22} />
      </div>
    );
  }

  if (credentials.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-5 py-8 space-y-6">
        {signOutBar}
        <div className="bg-card border border-border rounded-lg p-8 text-center text-sm text-ink-soft">
          <p className="font-medium text-ink mb-1">No credentials issued yet.</p>
          <p>
            When your college or university issues a credential to{' '}
            <span className="font-medium text-ink">{student.email}</span>, it appears here
            automatically.
          </p>
        </div>
      </div>
    );
  }

  const profile = buildStudentProfile(student, credentials);
  const profileUrl = buildProfileUrl(student.profileId);
  const yearGroups = groupCredentialsByYear(credentials);

  const handleDownloadResume = () => {
    downloadVerifiedResumePdf(profile, profile.credentialsDesc, profileUrl);
    notify('Verified resume PDF downloaded.', 'info');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-5 py-8 space-y-6">
      {signOutBar}

      <ProfileHeader
        profile={profile}
        onShare={() => setShareOpen(true)}
        onDownloadResume={handleDownloadResume}
      />

      <StatsRow stats={profile.stats} />

      <VerificationStatusCard profile={profile} />

      <div>
        <h2 className="text-base font-semibold mb-0.5">Academic credential graph</h2>
        <p className="text-xs text-ink-soft mb-3.5">
          Your verified academic journey, connected in one view.
        </p>
        <CredentialGraph profile={profile} credentials={credentials} />
      </div>

      <AcademicJourney yearGroups={yearGroups} />

      <div>
        <h2 className="text-base font-semibold mb-3.5">Credentials</h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {profile.credentialsDesc.map((c) => (
            <div key={c.credentialId} id={`credential-${c.credentialId}`}>
              <CredentialCard credential={c} notify={notify} />
            </div>
          ))}
        </div>
      </div>

      {shareOpen && (
        <ShareProfileModal
          profile={profile}
          profileUrl={profileUrl}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}

// ---- Profile header --------------------------------------------------------

function ProfileHeader({ profile, onShare, onDownloadResume }) {
  const initials = getInitials(profile.studentName);

  return (
    <div className="bg-card border border-border rounded-lg card-shadow p-6 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-start gap-5">
        <span className="w-16 h-16 rounded-full bg-teal-soft flex items-center justify-center text-teal text-lg font-semibold shrink-0">
          {initials}
        </span>

        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold leading-tight">
            {profile.studentName}
          </h1>
          {profile.primaryProgram && (
            <p className="text-sm text-ink-soft mt-1">{profile.primaryProgram}</p>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 text-xs text-ink-soft">
            {profile.primaryInstitution && (
              <span className="flex items-center gap-1">
                <Building2 size={12} />
                {profile.primaryInstitution}
              </span>
            )}
            <span className="flex items-center gap-1 font-mono">
              <BadgeCheck size={12} />
              {studentIdLabel(profile)}: {profile.studentId}
            </span>
            {profile.latestIssueYear && (
              <span className="flex items-center gap-1">
                <CalendarDays size={12} />
                Class of {profile.latestIssueYear}
              </span>
            )}
          </div>

          <div className="mt-4">
            {profile.allVerified ? (
              <span className="inline-flex items-center gap-1.5 bg-valid-soft text-valid text-sm font-medium rounded-full px-3 py-1.5">
                <ShieldCheck size={15} />
                Verified academic identity
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-revoked-soft text-revoked text-sm font-medium rounded-full px-3 py-1.5">
                <ShieldAlert size={15} />
                Attention needed
              </span>
            )}
          </div>
        </div>

        <div className="flex sm:flex-col gap-2 shrink-0">
          <button
            onClick={onShare}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-sm font-medium bg-teal text-white rounded-md px-4 py-2 hover:bg-teal/90 whitespace-nowrap"
          >
            <Share2 size={14} />
            Share Professional Passport
          </button>
          <button
            onClick={onDownloadResume}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-sm font-medium border border-border rounded-md px-4 py-2 hover:bg-bg whitespace-nowrap"
          >
            <Download size={14} />
            Verified resume
          </button>
          <p className="hidden sm:block text-[11px] text-ink-soft text-right max-w-[160px]">
            One verified profile for your academic credentials.
          </p>
        </div>
      </div>
    </div>
  );
}

// ---- Stats row --------------------------------------------------------------

function StatsRow({ stats }) {
  const tiles = [
    { label: 'Credentials', value: stats.total, icon: Layers },
    { label: 'Active / Verified', value: stats.active, icon: ShieldCheck },
    { label: 'Institutions', value: stats.institutions, icon: Landmark },
  ];
  if (stats.revoked > 0) {
    tiles.push({ label: 'Revoked', value: stats.revoked, icon: ShieldAlert, accent: true });
  }

  return (
    <div
      className={`grid grid-cols-2 gap-3.5 ${
        tiles.length === 4 ? 'sm:grid-cols-4' : 'sm:grid-cols-3'
      }`}
    >
      {tiles.map(({ label, value, icon: Icon, accent }) => (
        <div
          key={label}
          className="bg-card border border-border rounded-lg card-shadow p-4 flex items-center gap-3"
        >
          <span
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              accent ? 'bg-revoked-soft text-revoked' : 'bg-teal-soft text-teal'
            }`}
          >
            <Icon size={16} />
          </span>
          <div className="min-w-0">
            <p className="text-lg font-semibold leading-tight">{value}</p>
            <p className="text-xs text-ink-soft leading-tight truncate">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- Verification status ----------------------------------------------------

function VerificationStatusCard({ profile }) {
  return (
    <div
      className={`rounded-lg border card-shadow p-4 flex items-center gap-3 ${
        profile.allVerified ? 'bg-valid-soft/50 border-valid/25' : 'bg-revoked-soft/60 border-revoked/25'
      }`}
    >
      <span
        className={`w-9 h-9 rounded-full bg-white flex items-center justify-center shrink-0 ${
          profile.allVerified ? 'text-valid' : 'text-revoked'
        }`}
      >
        {profile.allVerified ? <ShieldCheck size={17} /> : <ShieldAlert size={17} />}
      </span>
      <div>
        <p className="text-sm font-semibold">Verification status</p>
        <p className="text-xs text-ink-soft mt-0.5">
          {profile.allVerified
            ? 'All credentials on this passport are currently valid and unrevoked.'
            : `${profile.stats.revoked} of ${profile.stats.total} credentials have been revoked and require attention.`}
        </p>
      </div>
    </div>
  );
}

// ---- Premium credential card -------------------------------------------------

function CredentialCard({ credential, notify }) {
  const [copied, setCopied] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);
  const revoked = credential.status === 'revoked';

  const handleShare = async () => {
    const url = `${window.location.origin}/verify?credentialId=${credential.credentialId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      notify('Verification link copied to clipboard.', 'success');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      notify('Could not copy link — clipboard unavailable.', 'error');
    }
  };

  const handleDownload = () => {
    downloadCertificatePdf(credential);
    notify('Certificate PDF downloaded.', 'info');
  };

  return (
    <div
      className={`bg-card border rounded-lg card-shadow card-hover p-5 flex flex-col ${
        revoked ? 'border-revoked/25' : 'border-border'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="font-semibold leading-snug">{credential.credentialType}</h3>
          <p className="text-xs text-ink-soft mt-0.5 flex items-center gap-1">
            <Building2 size={12} />
            {credential.issuer}
          </p>
        </div>
        <StatusBadge status={credential.status} size="sm" />
      </div>

      <p className="text-xs text-ink-soft flex items-center gap-1 mb-4">
        <CalendarDays size={12} />
        Issued {credential.issueDate}
      </p>

      <div className="flex items-center gap-4 mb-4">
        <div className="bg-white border border-border rounded-lg p-2 shrink-0">
          <QRCodeSVG value={credential.credentialId} size={76} fgColor="#1C2B2E" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-ink-soft">Credential ID</p>
          <p className="text-sm font-mono truncate">{credential.credentialId}</p>
        </div>
      </div>

      {revoked && credential.revocation && (
        <div className="bg-revoked-soft text-revoked text-xs rounded-md px-3 py-2 mb-4">
          Revoked on {credential.revocation.date} — {credential.revocation.reason}
        </div>
      )}

      <div className="border border-border rounded-md p-3.5 mb-4 bg-bg/50">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-xs font-semibold tracking-wide">CREDENTIAL DNA</p>
          <span
            className={`inline-flex items-center gap-1 text-[11px] font-medium rounded-full px-2 py-0.5 ${
              revoked ? 'bg-revoked-soft text-revoked' : 'bg-valid-soft text-valid'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${revoked ? 'bg-revoked' : 'bg-valid'}`}
              aria-hidden="true"
            />
            {revoked ? 'REVOKED' : 'VERIFIED'}
          </span>
        </div>

        <ul className="space-y-1 text-xs text-ink-soft mb-3">
          <li className="flex items-center gap-1.5">
            <Check size={11} className="text-valid shrink-0" />
            Document integrity: fingerprint registered
          </li>
          <li className="flex items-center gap-1.5">
            <Check size={11} className="text-valid shrink-0" />
            Issuer verified
          </li>
          <li className="flex items-center gap-1.5">
            {revoked ? (
              <>
                <ShieldAlert size={11} className="text-revoked shrink-0" />
                Credential status: revoked
              </>
            ) : (
              <>
                <Check size={11} className="text-valid shrink-0" />
                Credential status: active
              </>
            )}
          </li>
        </ul>

        <CredentialDNA hash={credential.hash} compact />

        <button
          onClick={() => setProofOpen(true)}
          className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-teal border border-teal/30 rounded-md px-3 py-1.5 mt-3 hover:bg-teal-soft/60"
        >
          <Eye size={13} aria-hidden="true" />
          View verification proof
        </button>
      </div>

      <div className="mb-1">
        <button
          onClick={() => setDetailsOpen((o) => !o)}
          className="w-full flex items-center justify-between text-xs text-ink-soft hover:text-ink py-1"
        >
          <span className="flex items-center gap-1.5">
            <Hash size={12} />
            Technical details
          </span>
          <ChevronDown
            size={13}
            className={`transition-transform ${detailsOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {detailsOpen && (
          <div className="pt-1 pb-1">
            <p className="text-[11px] text-ink-soft mb-1">
              Ledger reference (simulated — no live chain is connected in this prototype)
            </p>
            <HashChip value={credential.txHash} />
          </div>
        )}
      </div>

      <div className="mt-auto flex gap-2 pt-3">
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium bg-teal text-white rounded-md px-3 py-2 hover:bg-teal/90"
        >
          <Download size={14} />
          Download
        </button>
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium border border-border rounded-md px-3 py-2 hover:bg-bg"
        >
          {copied ? <Check size={14} className="text-valid" /> : <LinkIcon size={14} />}
          {copied ? 'Copied' : 'Share link'}
        </button>
      </div>

      {proofOpen && (
        <VerificationProofModal credential={credential} onClose={() => setProofOpen(false)} />
      )}
    </div>
  );
}
