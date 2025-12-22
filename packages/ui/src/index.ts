/**
 * @gameview/ui
 * Shared React UI components for the Game View platform
 * Dark coral theme optimized for video production workflows
 */

// Core components
export { Button, buttonVariants } from './components/Button';
export type { ButtonProps } from './components/Button';

export { Input } from './components/Input';
export type { InputProps } from './components/Input';

export { Label } from './components/Label';
export type { LabelProps } from './components/Label';

export { Progress } from './components/Progress';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from './components/Card';

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
} from './components/Select';

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './components/Dialog';

export { Tabs, TabsList, TabsTrigger, TabsContent } from './components/Tabs';

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './components/Table';

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
} from './components/Toast';
export { Toaster } from './components/Toaster';
export { useToast, toast } from './hooks/useToast';

export { Badge, badgeVariants } from './components/Badge';
export type { BadgeProps } from './components/Badge';

export { Spinner } from './components/Spinner';

// Domain components
export { ProcessingProgress } from './components/ProcessingProgress';
export { VideoDropZone } from './components/VideoDropZone';
export { VideoThumbnail } from './components/VideoThumbnail';
export type { VideoThumbnailProps } from './components/VideoThumbnail';
export { PresetSelector } from './components/PresetSelector';

// New Game View themed components
export { RabbitLoader } from './components/RabbitLoader';
export { TutorialModal, TutorialOverlay } from './components/TutorialModal';
export type { TutorialStep } from './components/TutorialModal';
export { FileGrid, FileUploadArea } from './components/FileGrid';
export type { FileItem } from './components/FileGrid';
export { AppSidebar, defaultNavItems } from './components/AppSidebar';
export type { NavItem } from './components/AppSidebar';

// Utilities
export { cn, formatDuration, formatFileSize } from './lib/utils';
