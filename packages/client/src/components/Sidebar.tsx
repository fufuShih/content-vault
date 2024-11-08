const Sidebar = () => {
  return (
    <div className="w-64 h-[calc(100vh-64px)] border-r bg-background flex flex-col">
      <div className="p-4">
        <h2 className="font-semibold mb-4">Library</h2>
        <nav className="space-y-2">
          <a href="#" className="flex items-center space-x-2 px-3 py-2 rounded-md bg-accent">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>All Books</span>
          </a>
          <a href="#" className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-accent/50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <span>Collections</span>
          </a>
          <a href="#" className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-accent/50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <span>Bookmarks</span>
          </a>
          <a href="#" className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-accent/50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Recent</span>
          </a>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
