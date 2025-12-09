/**
 * Color constants for the Drug Discovery AI app
 * Dark Futuristic Dashboard Theme
 */

export const Colors = {
  // Background colors
  background: {
    primary: '#0D0D0D',
    secondary: '#1A1A1A',
    tertiary: '#262626',
    card: '#1E1E1E',
  },

  // Accent colors
  accent: {
    cyan: '#00D4FF',
    blue: '#0066FF',
    purple: '#8B5CF6',
    pink: '#EC4899',
  },

  // Mind map node colors
  node: {
    disease: '#EC4899',    // Pink
    molecule: '#8B5CF6',   // Purple
    product: '#FBBF24',    // Yellow
  },

  // Status colors
  status: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    pending: '#6B7280',
  },

  // Text colors
  text: {
    primary: '#FFFFFF',
    secondary: '#A1A1AA',
    muted: '#71717A',
  },

  // Border colors
  border: {
    default: '#3F3F46',
    light: '#52525B',
  },

  // Transparent variants
  transparent: {
    cyan10: 'rgba(0, 212, 255, 0.1)',
    cyan20: 'rgba(0, 212, 255, 0.2)',
    cyan30: 'rgba(0, 212, 255, 0.3)',
    white10: 'rgba(255, 255, 255, 0.1)',
    white20: 'rgba(255, 255, 255, 0.2)',
  },
};

export const NodeColors = {
  disease: Colors.node.disease,
  molecule: Colors.node.molecule,
  product: Colors.node.product,
};

export const StatusColors = {
  pending: Colors.status.pending,
  in_progress: Colors.accent.cyan,
  completed: Colors.status.success,
  failed: Colors.status.error,
};

export default Colors;
