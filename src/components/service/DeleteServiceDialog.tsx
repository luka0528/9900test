import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

interface DeleteServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  serviceName: string;
}

export function DeleteServiceDialog({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  serviceName,
}: DeleteServiceDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Service</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete {serviceName}? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="mt-2 text-sm text-muted-foreground">
          This will permanently delete:
          <ul className="mt-2 list-disc pl-6">
            <li>All service versions and content</li>
            <li>All subscription tiers and features</li>
            <li>All ratings and reviews</li>
            <li>All consumer subscriptions</li>
            <li>All API keys associated with this service</li>
          </ul>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Service"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
