import { Bell, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { useState, useCallback } from "react";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Badge } from "~/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export function NotificationDropdown() {
  const { data: session } = useSession();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { data, refetch } = api.notification.getMyNotifications.useQuery(
    { 
      includeRead: true,
      limit: 50 
    },
    { enabled: !!session }
  );

  const utils = api.useContext();

  const { mutate: markAsRead } = api.notification.markAsRead.useMutation({
    onSuccess: () => refetch(),
  });

  const { mutate: markAllAsRead } = api.notification.markAllAsRead.useMutation({
    onSuccess: () => refetch(),
  });

  const { mutate: deleteNotification } = api.notification.deleteNotification.useMutation({
    onMutate: async ({ notificationId }) => {
      // Cancel outgoing refetches
      await utils.notification.getMyNotifications.cancel();
      
      // Get current notifications
      const prevData = utils.notification.getMyNotifications.getData({ includeRead: true, limit: 50 });
      
      // Optimistically remove the notification
      utils.notification.getMyNotifications.setData(
        { includeRead: true, limit: 50 },
        (old) => {
          if (!old) return prevData;
          return {
            ...old,
            notifications: old.notifications.filter((n) => n.id !== notificationId),
          };
        }
      );

      setDeletingId(notificationId);
      setIsDeleting(true);
      
      return { prevData };
    },
    onSuccess: () => {
      setDeletingId(null);
      setIsDeleting(false);
    },
    onError: (_, __, context) => {
      // If mutation fails, restore previous data
      if (context?.prevData) {
        utils.notification.getMyNotifications.setData(
          { includeRead: true, limit: 50 },
          context.prevData
        );
      }
      setDeletingId(null);
      setIsDeleting(false);
    },
    // Disable automatic refetch on success since we're handling updates optimistically
    onSettled: () => {
      void utils.notification.getMyNotifications.invalidate();
    }
  });

  // Memoized delete handler with better guard clauses
  const handleDelete = useCallback((notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Guard clauses to prevent multiple deletions
    if (isDeleting) return;
    if (deletingId === notificationId) return;
    
    setDeletingId(notificationId);
    deleteNotification({ notificationId });
  }, [deletingId, isDeleting, deleteNotification]);

  const unreadCount = data?.notifications.filter((n) => !n.read).length ?? 0;

  // Move conditional return after all hooks
  if (!session) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead()}
              className="h-auto px-2 text-xs"
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          <DropdownMenuGroup>
            {data?.notifications.length === 0 ? (
              <div className="px-2 py-4 text-sm text-muted-foreground text-center pointer-events-none">
                No notifications
              </div>
            ) : (
              data?.notifications.map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className="flex flex-col items-start gap-1 p-4"
                  onClick={() => !notification.read && markAsRead({ notificationId: notification.id })}
                >
                  <div className="flex w-full items-start justify-between gap-2 pr-6">
                    <span className="font-medium">
                      {notification.sender.name ?? "Unknown"}
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 pr-6">
                    {notification.content}
                  </p>
                  {!notification.read && (
                    <Badge variant="secondary" className="mt-1">New</Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-2 h-6 w-6 p-0 hover:bg-muted"
                    onClick={(e) => handleDelete(notification.id, e)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuGroup>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}