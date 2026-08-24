import React, { useState, useRef, useCallback } from 'react';

interface ResizableLayoutProps {
  topComponent: React.ReactNode;
  bottomComponent: React.ReactNode;
  sidebarComponent: React.ReactNode;
  leftSidebarComponent: React.ReactNode;
}

export const ResizableLayout: React.FC<ResizableLayoutProps> = ({
  topComponent,
  bottomComponent,
  sidebarComponent,
  leftSidebarComponent,
}) => {
  const [topHeight, setTopHeight] = useState<number>(240); // default top pipeline height
  const [sidebarWidth, setSidebarWidth] = useState<number>(300); // default right sidebar width

  const isDraggingVertical = useRef(false);
  const isDraggingHorizontal = useRef(false);

  const startVerticalDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingVertical.current = true;
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingVertical.current) return;
      const newHeight = Math.max(120, Math.min(500, moveEvent.clientY - 56));
      setTopHeight(newHeight);
    };
    const handleMouseUp = () => {
      isDraggingVertical.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, []);

  const startHorizontalDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingHorizontal.current = true;
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingHorizontal.current) return;
      const newWidth = Math.max(200, Math.min(500, window.innerWidth - moveEvent.clientX));
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => {
      isDraggingHorizontal.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <div className="flex flex-1 overflow-hidden bg-[#111111] text-[#FFFFFF] select-none">
      {/* Left Navigation & Projects Sidebar */}
      {leftSidebarComponent}

      {/* Main Execution & Chat Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Pipeline Execution Component */}
        <div style={{ height: `${topHeight}px` }} className="overflow-y-auto shrink-0 border-b border-[#555555]">
          {topComponent}
        </div>

        {/* Draggable Vertical Divider Handle */}
        <div
          onMouseDown={startVerticalDrag}
          className="h-1.5 bg-[#333333] hover:bg-[#555555] active:bg-[#999999] cursor-row-resize transition flex items-center justify-center shrink-0 group border-y border-[#555555]"
          title="Drag to resize Pipeline vs Chat"
        >
          <div className="w-10 h-0.5 rounded bg-[#555555] group-hover:bg-[#999999]" />
        </div>

        {/* Bottom Workspace Chat & Final Report Component */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {bottomComponent}
        </div>
      </div>

      {/* Draggable Horizontal Divider Handle */}
      <div
        onMouseDown={startHorizontalDrag}
        className="w-1.5 bg-[#333333] hover:bg-[#555555] active:bg-[#999999] cursor-col-resize transition flex items-center justify-center shrink-0 group border-x border-[#555555]"
        title="Drag to resize Timeline Sidebar"
      >
        <div className="h-10 w-0.5 rounded bg-[#555555] group-hover:bg-[#999999]" />
      </div>

      {/* Right Execution Timeline Sidebar Component */}
      <div style={{ width: `${sidebarWidth}px` }} className="shrink-0 overflow-y-auto bg-[#111111] border-l border-[#555555]">
        {sidebarComponent}
      </div>
    </div>
  );
};
