import { useEffect } from 'react';

interface MetaTagOptions {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
}

export const useMetaTags = (options: MetaTagOptions) => {
  useEffect(() => {
    const updateMetaTag = (name: string, content: string, property?: string) => {
      const selector = property ? `meta[property="${property}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', property);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    };

    // Update title
    if (options.title) {
      document.title = options.title;
    }

    // Update meta description
    if (options.description) {
      updateMetaTag('description', options.description);
    }

    // Update meta keywords
    if (options.keywords) {
      updateMetaTag('keywords', options.keywords);
    }

    // Update Open Graph tags
    if (options.ogTitle) {
      updateMetaTag('og:title', options.ogTitle, 'og:title');
    }
    if (options.ogDescription) {
      updateMetaTag('og:description', options.ogDescription, 'og:description');
    }
    if (options.ogImage) {
      updateMetaTag('og:image', options.ogImage, 'og:image');
    }
    if (options.ogUrl) {
      updateMetaTag('og:url', options.ogUrl, 'og:url');
    }

    // Update Twitter Card tags
    if (options.twitterCard) {
      updateMetaTag('twitter:card', options.twitterCard, 'twitter:card');
    }
    if (options.twitterTitle) {
      updateMetaTag('twitter:title', options.twitterTitle, 'twitter:title');
    }
    if (options.twitterDescription) {
      updateMetaTag('twitter:description', options.twitterDescription, 'twitter:description');
    }
    if (options.twitterImage) {
      updateMetaTag('twitter:image', options.twitterImage, 'twitter:image');
    }
  }, [options]);
};
