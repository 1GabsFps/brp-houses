import React, { useState } from "react";

// Lista de itens que possuem ícones gerados em PNG estilo MMO RPG
const CUSTOM_IMAGE_ITEMS: Record<string, string> = {
  queijo: "/items/queijo.png",
  queijos: "/items/queijo.png",
};

interface ItemIconProps {
  name: string;
  fallbackEmoji?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "w-6 h-6 text-sm",
  md: "w-8 h-8 text-lg",
  lg: "w-12 h-12 text-2xl",
  xl: "w-16 h-16 text-4xl",
};

export const ItemIcon: React.FC<ItemIconProps> = ({
  name,
  fallbackEmoji = "📦",
  className = "",
  size = "md",
}) => {
  const normalizedKey = name.trim().toLowerCase();
  const imageSrc = CUSTOM_IMAGE_ITEMS[normalizedKey];
  const [hasError, setHasError] = useState(false);

  if (imageSrc && !hasError) {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-xl bg-gradient-to-b from-purple-500/10 to-purple-900/20 border border-purple-500/30 p-1 shadow-lg shadow-purple-950/40 overflow-hidden group ${sizeClasses[size]} ${className}`}
      >
        <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/15 transition duration-200" />
        <img
          src={imageSrc}
          alt={name}
          onError={() => setHasError(true)}
          className="w-full h-full object-contain relative z-10 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] transform group-hover:scale-110 transition duration-200"
        />
      </div>
    );
  }

  return (
    <span className={`inline-flex items-center justify-center ${className}`}>
      {fallbackEmoji}
    </span>
  );
};

export default ItemIcon;
