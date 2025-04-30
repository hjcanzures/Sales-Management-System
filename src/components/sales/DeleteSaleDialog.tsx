
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
  
  const handleConfirm = () => {
    setProcessing(true);
    onConfirm();
    setProcessing(false);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={processing ? undefined : onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Sale</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete sale #{saleNumber}? This action can be undone later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={processing} onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={processing} onClick={handleConfirm}>
            {processing ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
