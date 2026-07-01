import { Link } from 'react-router-dom';
import './Breadcrumb.css';

export interface BreadcrumbItem {
  label: string;
  url?: string; // TypeScript xətasını həll edən əsas dəyişiklik
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="breadcrumb-container">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <span key={index} className="breadcrumb-item-wrapper">
            {isLast || !item.url ? (
              <span className="breadcrumb-item current">{item.label}</span>
            ) : (
              <Link to={item.url} className="breadcrumb-item link">
                {item.label}
              </Link>
            )}
            {!isLast && <span className="breadcrumb-separator">›</span>}
          </span>
        );
      })}
    </nav>
  );
}

export default Breadcrumb;