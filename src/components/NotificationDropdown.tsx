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
    { 
      enabled: !!session,
      refetchInterval: 30000,
      refetchIntervalInBackground: true,
      staleTime: 10000,
      select: (data) => ({
        ...data,
        notifications: [...data.notifications].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      })
    }
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
      await utils.notification.getMyNotifications.cancel();
      const prevData = utils.notification.getMyNotifications.getData({ includeRead: true, limit: 50 });
      
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
      if (context?.prevData) {
        utils.notification.getMyNotifications.setData(
          { includeRead: true, limit: 50 },
          context.prevData
        );
      }
      setDeletingId(null);
      setIsDeleting(false);
    },
    onSettled: () => {
      void utils.notification.getMyNotifications.invalidate();
    }
  });

  const handleDelete = useCallback((notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleting || deletingId === notificationId) return;
    setDeletingId(notificationId);
    deleteNotification({ notificationId });
  }, [deletingId, isDeleting, deleteNotification]);

  const unreadCount = data?.notifications.filter((n) => !n.read).length ?? 0;

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
      <DropdownMenuContent className="w-96" align="end">
        <DropdownMenuLabel className="flex justify-between items-center py-3">
          <span className="text-lg font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead()}
              className="h-8 px-3 text-xs hover:bg-secondary"
            >
              Mark all as read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[500px]">
          <DropdownMenuGroup className="p-2">
            {data?.notifications.length === 0 ? (
              <div className="px-4 py-8 text-sm text-muted-foreground text-center">
                No notifications
              </div>
            ) : (
              data?.notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`mb-2 rounded-lg border p-4 transition-colors ${
                    !notification.read ? 'bg-secondary/40' : ''
                  } hover:bg-secondary/20`}
                  onClick={() => !notification.read && markAsRead({ notificationId: notification.id })}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1 flex-grow">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {notification.sender.name ?? "Unknown"}
                        </span>
                        {!notification.read && (
                          <Badge variant="secondary" className="h-5">New</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive"
                      onClick={(e) => handleDelete(notification.id, e)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="mt-2 text-sm text-foreground/90 whitespace-pre-wrap">
                    {notification.content}
                  </p>
                </div>
              ))
            )}
          </DropdownMenuGroup>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}