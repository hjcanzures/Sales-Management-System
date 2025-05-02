
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

interface DeleteSaleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  saleNumber: string;
}

export const DeleteSaleDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  saleNumber 
}: DeleteSaleDialogProps) => {
  const [processing, setProcessing] = useState(false);
  
  const handleConfirm = async () => {
    try {
      setProcessing(true);
      await onConfirm();
    } catch (error) {
      console.error("Error deleting sale:", error);
    } finally {
      setProcessing(false);
      onClose();
    }
  };

  return (
    <AlertDialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open && !processing) {
          onClose();
        }
      }}
    >
      <AlertDialogContent onEscapeKeyDown={(e) => {
        if (!processing) {
          e.preventDefault();
          onClose();
        }
      }}>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Sale</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete sale #{saleNumber}? This action can be undone later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={processing} onClick={() => !processing && onClose()}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction disabled={processing} onClick={handleConfirm}>
            {processing ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
