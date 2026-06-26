import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Database, Link2, FolderTree, Tag, List, ChevronRight, ChevronDown, History } from 'lucide-react';
import './Layout.css';

const navSections = [
  {
    title: 'Creation',
    icon: <Database size={18} />,
    groups: [
      {
        title: 'Core',
        items: [
          { path: '/core-category', label: 'Category', icon: <FolderTree size={16} /> },
          { path: '/core-attribute', label: 'Attribute', icon: <Tag size={16} /> },
          { path: '/core-lov', label: 'LOV', icon: <List size={16} /> },
        ]
      },
      {
        title: 'Channel',
        items: [
          { path: '/channel-category', label: 'Category', icon: <FolderTree size={16} /> },
          { path: '/channel-attribute', label: 'Attribute', icon: <Tag size={16} /> },
          { path: '/channel-lov', label: 'LOV', icon: <List size={16} /> },
        ]
      }
    ]
  },
  {
    title: 'Mapping',
    icon: <Link2 size={18} />,
    groups: [
      {
        title: 'Tenant to Core',
        items: [
          { path: '/mapping/tenant-core-cat', label: 'Category', icon: <FolderTree size={16} /> },
          { path: '/mapping/tenant-core-attr', label: 'Attribute', icon: <Tag size={16} /> },
          { path: '/mapping/tenant-core-lov', label: 'LOV', icon: <List size={16} /> },
        ]
      },
      {
        title: 'Core to Channel',
        items: [
          { path: '/mapping/core-channel-cat', label: 'Category', icon: <FolderTree size={16} /> },
          { path: '/mapping/core-channel-attr', label: 'Attribute', icon: <Tag size={16} /> },
          { path: '/mapping/core-channel-lov', label: 'LOV', icon: <List size={16} /> },
        ]
      }
    ]
  }
];

const SidebarGroup = ({ group }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="nav-group">
      <div className="nav-group-title" onClick={() => setIsOpen(!isOpen)}>
        <span>{group.title}</span>
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </div>
      {isOpen && (
        <ul className="nav-list">
          {group.items.map((item) => (
            <li key={item.path}>
              <NavLink 
                to={item.path} 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">V</div>
        <h2>Vinculum</h2>
      </div>
      
      <nav className="sidebar-nav">
        {navSections.map((section, idx) => (
          <div key={idx} className="nav-section">
            <h3 className="section-title">
              {section.icon}
              <span>{section.title}</span>
            </h3>
            <div className="nav-groups">
              {section.groups.map((group, gIdx) => (
                <SidebarGroup key={gIdx} group={group} />
              ))}
            </div>
          </div>
        ))}

        <div className="nav-section">
          <h3 className="section-title">
            <History size={18} />
            <span>Monitoring</span>
          </h3>
          <ul className="nav-list">
            <li>
              <NavLink
                to="/task-history"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                <History size={16} />
                <span>Task History</span>
              </NavLink>
            </li>
          </ul>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
