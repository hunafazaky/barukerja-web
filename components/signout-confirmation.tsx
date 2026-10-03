import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { SignOutIcon } from "@phosphor-icons/react";
import { Button } from "./ui/button";

// My Import
import { useAuth } from "@/context/AuthContext";

// trigger lets callers swap in a different-looking button (e.g. a
// compact icon-only one for the mobile header — see site-header.tsx)
// while sharing the same confirm-before-signing-out flow. Defaults to
// the full-width destructive button used in the sidebar's NavUser.
export function SignoutConfirmation({
  trigger,
}: {
  trigger?: React.ReactElement;
}) {
  // My Const
  const { signout } = useAuth();

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          trigger ?? (
            <Button className="w-full" variant={"destructive"}>
              <SignOutIcon />
              Log out
            </Button>
          )
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sign Out?</AlertDialogTitle>
          <AlertDialogDescription>
            Your access to this account will be deleted, you need to Sign in
            again to regain your access.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => signout()}>
            Confirm
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
