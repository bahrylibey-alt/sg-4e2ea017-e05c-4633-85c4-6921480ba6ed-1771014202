import { getProduct, getProductUrl } from "@/config/products";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface ProductLinkProps {
  productId: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  showIcon?: boolean;
}

/**
 * Simple Affiliate Link Component
 * Usage: <ProductLink productId="prod_001" />
 */
export function ProductLink({
  productId,
  variant = "default",
  size = "default",
  className = "",
  showIcon = true
}: ProductLinkProps) {
  const product = getProduct(productId);

  if (!product) {
    return (
      <div className="text-red-500 text-sm">
        Product not found: {productId}
      </div>
    );
  }

  const url = getProductUrl(productId);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener sponsored nofollow"
      className="inline-block"
    >
      <Button variant={variant} size={size} className={className}>
        {product.buttonText || `Get ${product.name}`}
        {showIcon && <ExternalLink className="ml-2 h-4 w-4" />}
      </Button>
    </a>
  );
}

/**
 * Inline Product Link (text style)
 */
export function InlineProductLink({
  productId,
  children
}: {
  productId: string;
  children?: React.ReactNode;
}) {
  const product = getProduct(productId);

  if (!product) {
    return <span className="text-red-500">Product not found</span>;
  }

  const url = getProductUrl(productId);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener sponsored nofollow"
      className="text-primary hover:underline font-semibold"
    >
      {children || product.name}
    </a>
  );
}

/**
 * Product Box (styled container)
 */
export function ProductBox({ productId }: { productId: string }) {
  const product = getProduct(productId);

  if (!product) {
    return <div className="text-red-500">Product not found: {productId}</div>;
  }

  const url = getProductUrl(productId);

  return (
    <div className="border border-border rounded-lg p-6 my-4 bg-card hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
      {product.description && (
        <p className="text-muted-foreground mb-4">{product.description}</p>
      )}
      <a
        href={url}
        target="_blank"
        rel="noopener sponsored nofollow"
        className="inline-block"
      >
        <Button className="w-full sm:w-auto">
          {product.buttonText || `Get ${product.name}`}
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </a>
    </div>
  );
}