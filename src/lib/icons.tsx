import Image from "next/image";

export const DiscordIcon = () => {
  return (
    <Image src="/logos/discord-icon.svg" alt="Discord" width={20} height={20} />
  );
};

export const GoogleIcon = () => {
  return (
    <Image
      src="/logos/google-icon-logo.svg"
      alt="Google"
      width={20}
      height={20}
    />
  );
};

export const AzureIcon = () => {
  return (
    <Image
      src="/logos/microsoft-svgrepo-com.svg"
      alt="Azure"
      width={20}
      height={20}
    />
  );
};

export function getProviderIcon(provider: string) {
  switch (provider) {
    case "discord":
      return <DiscordIcon />;
    case "google":
      return <GoogleIcon />;
    case "azure-ad":
      return <AzureIcon />;
    default:
      return null;
  }
}

export function getProviderName(provider: string) {
  switch (provider) {
    case "discord":
      return "Discord";
    case "google":
      return "Google";
    case "azure-ad":
      return "Microsoft";
    default:
      return null;
  }
}

export function getKollmannLogo(size: "sm" | "md" | "lg") {
  const remSize = size === "sm" ? 2 : size === "md" ? 3 : 5;

  return (
    <h1 className="font-trajan text-foreground">
      <span className={`text-primary text-${remSize}rem`}>K</span>
      <span className={`text-foreground text-${remSize - 0.5}rem`}>OLLMANN</span>
    </h1>
  );
}
