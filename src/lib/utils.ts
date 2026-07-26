import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getUsername(profile: any, user: any) {
  return profile?.username || user?.email?.split('@')[0] || '';
}

export function fixOklchColors(clonedDoc: Document) {
  const elements = clonedDoc.getElementsByTagName('*');
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i] as HTMLElement;
    
    // Check computed styles
    const style = window.getComputedStyle(el);
    const props = ['color', 'background-color', 'border-color', 'fill', 'stroke', 'background', 'background-image', 'border', 'outline-color'];
    props.forEach(prop => {
      const value = style.getPropertyValue(prop);
      if (value && (value.includes('oklch') || value.includes('oklab'))) {
        // Simple fallback: replace with white for text/icons, dark for backgrounds
        if (prop === 'color' || prop === 'fill' || prop === 'stroke') {
          el.style.setProperty(prop, '#ffffff', 'important');
        } else if (prop === 'background-color' || prop === 'background' || prop === 'background-image') {
          el.style.setProperty(prop, '#141414', 'important');
          if (prop === 'background-image') el.style.backgroundImage = 'none';
        } else {
          el.style.setProperty(prop, '#333333', 'important');
        }
      }
    });
    
    // Also check inline styles and replace regex
    const inlineStyle = el.getAttribute('style');
    if (inlineStyle && (inlineStyle.includes('oklch') || inlineStyle.includes('oklab'))) {
      let newStyle = inlineStyle;
      // Replace oklch(...) with a safe fallback
      newStyle = newStyle.replace(/oklch\([^)]+\)/g, '#ffffff');
      newStyle = newStyle.replace(/oklab\([^)]+\)/g, '#ffffff');
      el.setAttribute('style', newStyle);
    }
  }
}
