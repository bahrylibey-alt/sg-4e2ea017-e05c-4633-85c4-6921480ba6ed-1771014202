import { useEffect, useState } from "react";
import { getProductBySlug, getProductUrl, type Product } from "@/config/products";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";

interface ProductLinkProps {
  slug: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  showIcon?: boolean;
}

/**
 * Database-Connected Affiliate Link Component
 * Usage: <ProductLink slug="your-product-slug" />
 */
export function ProductLink({
  slug,
  variant = "default",
  size = "default",
  className = "",
  showIcon = true
}: ProductLinkProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const data = await getProductBySlug(slug);
      setProduct(data);
      setLoading(false);
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  if (loading) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading...
      </Button>
    );
  }

  if (!product) {
    return (
      <div className="text-red-500 text-sm">
        Product not found: {slug}
      </div>
    );
  }

  const url = getProductUrl(slug);

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
  slug,
  children
}: {
  slug: string;
  children?: React.ReactNode;
}) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const data = await getProductBySlug(slug);
      setProduct(data);
      setLoading(false);
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  if (loading) {
    return <span className="text-muted-foreground">Loading...</span>;
  }

  if (!product) {
    return <span className="text-red-500">Product not found</span>;
  }

  const url = getProductUrl(slug);

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
 * Product Box (styled container with SEO-rich data)
 */
export function ProductBox({ slug }: { slug: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const data = await getProductBySlug(slug);
      setProduct(data);
      setLoading(false);
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="border border-border rounded-lg p-6 my-4 bg-card">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading product...</span>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-red-500 border border-red-200 rounded-lg p-4 my-4">
        Product not found: {slug}
      </div>
    );
  }

  const url = getProductUrl(slug);

  return (
    <div className="border border-border rounded-lg p-6 my-4 bg-card hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
          {product.description && (
            <p className="text-muted-foreground mb-4">{product.description}</p>
          )}
          {product.clicks !== undefined && product.clicks > 0 && (
            <div className="text-xs text-muted-foreground mb-4">
              🔥 {product.clicks} people checked this out
            </div>
          )}
        </div>
      </div>
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