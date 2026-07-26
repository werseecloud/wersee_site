import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, GripVertical, FileText, Video, Link as LinkIcon, ChevronDown, ChevronRight, Edit2, AlertCircle } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Modal } from '../ui/Modal';

interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'pdf' | 'link';
  content?: string;
  duration?: string;
}

interface CourseCurriculumProps {
  modules: Module[];
  onChange: (modules: Module[]) => void;
}

export const CourseCurriculum: React.FC<CourseCurriculumProps> = ({ modules, onChange }) => {
  const [expandedModules, setExpandedModules] = useState<string[]>(modules.map(m => m.id));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'module' | 'lesson', moduleId: string, lessonId?: string } | null>(null);

  const toggleModule = (id: string) => {
    setExpandedModules(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const addModule = () => {
    const newModule: Module = {
      id: `module-${Date.now()}`,
      title: 'New Module',
      lessons: []
    };
    onChange([...modules, newModule]);
    setExpandedModules(prev => [...prev, newModule.id]);
    setEditingId(newModule.id);
  };

  const addLesson = (moduleId: string) => {
    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      title: 'New Lesson',
      type: 'video'
    };
    
    onChange(modules.map(m => {
      if (m.id === moduleId) {
        return { ...m, lessons: [...m.lessons, newLesson] };
      }
      return m;
    }));
    setEditingId(newLesson.id);
  };

  const updateModuleTitle = (id: string, title: string) => {
    onChange(modules.map(m => m.id === id ? { ...m, title } : m));
  };

  const updateLesson = (moduleId: string, lessonId: string, updates: Partial<Lesson>) => {
    onChange(modules.map(m => {
      if (m.id === moduleId) {
        return {
          ...m,
          lessons: m.lessons.map(l => l.id === lessonId ? { ...l, ...updates } : l)
        };
      }
      return m;
    }));
  };

  const handleDelete = () => {
    if (!confirmDelete) return;

    if (confirmDelete.type === 'module') {
      onChange(modules.filter(m => m.id !== confirmDelete.moduleId));
    } else if (confirmDelete.type === 'lesson' && confirmDelete.lessonId) {
      onChange(modules.map(m => {
        if (m.id === confirmDelete.moduleId) {
          return { ...m, lessons: m.lessons.filter(l => l.id !== confirmDelete.lessonId) };
        }
        return m;
      }));
    }
    setConfirmDelete(null);
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    if (type === 'module') {
      const newModules = Array.from(modules);
      const [removed] = newModules.splice(source.index, 1);
      newModules.splice(destination.index, 0, removed);
      onChange(newModules);
      return;
    }

    if (type === 'lesson') {
      const sourceModuleIndex = modules.findIndex(m => m.id === source.droppableId);
      const destModuleIndex = modules.findIndex(m => m.id === destination.droppableId);
      
      const newModules = [...modules];
      const sourceModule = newModules[sourceModuleIndex];
      const destModule = newModules[destModuleIndex];
      
      const [removed] = sourceModule.lessons.splice(source.index, 1);
      destModule.lessons.splice(destination.index, 0, removed);
      
      onChange(newModules);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-white">Course Curriculum</h3>
        <button 
          onClick={addModule}
          className="w-full sm:w-auto px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Module
        </button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="curriculum" type="module">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3 sm:space-y-4">
              {modules.map((module, index) => (
                // @ts-ignore
                <Draggable key={module.id} draggableId={module.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="bg-[#1A1A1A] border border-white/10 rounded-xl overflow-hidden"
                    >
                      <div className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3 bg-[#222] border-b border-white/5">
                        <div {...provided.dragHandleProps} className="cursor-grab text-gray-500 hover:text-white p-1">
                          <GripVertical className="w-5 h-5" />
                        </div>
                        <button onClick={() => toggleModule(module.id)} className="text-gray-400 hover:text-white p-1">
                          {expandedModules.includes(module.id) ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                        </button>
                        
                        {editingId === module.id ? (
                          <input
                            autoFocus
                            type="text"
                            value={module.title}
                            onChange={(e) => updateModuleTitle(module.id, e.target.value)}
                            onBlur={() => setEditingId(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                            className="flex-1 bg-black/20 border border-white/10 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-white/30"
                          />
                        ) : (
                          <span 
                            className="flex-1 font-medium text-white cursor-pointer hover:text-gray-200 truncate text-sm sm:text-base"
                            onClick={() => setEditingId(module.id)}
                          >
                            {module.title}
                          </span>
                        )}

                        <div className="flex items-center gap-2">
                          <span className="hidden sm:inline text-xs text-gray-500">{module.lessons.length} lessons</span>
                          <button 
                            onClick={() => setConfirmDelete({ type: 'module', moduleId: module.id })}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <AnimatePresence>
                        {expandedModules.includes(module.id) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                          >
                            <Droppable droppableId={module.id} type="lesson">
                              {(provided) => (
                                <div 
                                  ref={provided.innerRef} 
                                  {...provided.droppableProps}
                                  className="p-2 space-y-2 bg-[#141414]"
                                >
                                  {module.lessons.map((lesson, lessonIndex) => (
                                    // @ts-ignore
                                    <Draggable key={lesson.id} draggableId={lesson.id} index={lessonIndex}>
                                      {(provided) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 bg-[#1A1A1A] border border-white/5 rounded-lg group hover:border-white/10 transition-colors"
                                        >
                                          <div className="flex items-center gap-3 flex-1">
                                            <div {...provided.dragHandleProps} className="cursor-grab text-gray-600 hover:text-gray-400 p-1">
                                              <GripVertical className="w-4 h-4" />
                                            </div>
                                            
                                            <div className="p-1.5 bg-white/5 rounded text-gray-400">
                                              {lesson.type === 'video' && <Video className="w-4 h-4" />}
                                              {lesson.type === 'text' && <FileText className="w-4 h-4" />}
                                              {lesson.type === 'pdf' && <FileText className="w-4 h-4" />}
                                              {lesson.type === 'link' && <LinkIcon className="w-4 h-4" />}
                                            </div>

                                            {editingId === lesson.id ? (
                                              <input
                                                autoFocus
                                                type="text"
                                                value={lesson.title}
                                                onChange={(e) => updateLesson(module.id, lesson.id, { title: e.target.value })}
                                                onBlur={() => setEditingId(null)}
                                                onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                                                className="flex-1 bg-black/20 border border-white/10 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-white/30"
                                              />
                                            ) : (
                                              <span 
                                                className="flex-1 text-sm text-gray-300 cursor-pointer hover:text-white truncate"
                                                onClick={() => setEditingId(lesson.id)}
                                              >
                                                {lesson.title}
                                              </span>
                                            )}
                                          </div>

                                          <div className="flex items-center justify-end gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            {lesson.type === 'video' && (
                                              <input
                                                type="text"
                                                placeholder="10:00"
                                                value={lesson.duration || ''}
                                                onChange={(e) => updateLesson(module.id, lesson.id, { duration: e.target.value })}
                                                className="w-16 bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-gray-400 focus:outline-none"
                                              />
                                            )}
                                            <select
                                              value={lesson.type}
                                              onChange={(e) => updateLesson(module.id, lesson.id, { type: e.target.value as any })}
                                              className="bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-gray-400 focus:outline-none"
                                            >
                                              <option value="video">Video</option>
                                              <option value="text">Text</option>
                                              <option value="pdf">PDF</option>
                                              <option value="link">Link</option>
                                            </select>
                                            <button 
                                              onClick={() => setConfirmDelete({ type: 'lesson', moduleId: module.id, lessonId: lesson.id })}
                                              className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                  <button 
                                    onClick={() => addLesson(module.id)}
                                    className="w-full py-3 flex items-center justify-center gap-2 text-xs font-medium text-gray-500 hover:text-white hover:bg-white/5 rounded-lg border border-dashed border-white/10 hover:border-white/20 transition-all"
                                  >
                                    <Plus className="w-3.5 h-3.5" /> Add Lesson
                                  </button>
                                </div>
                              )}
                            </Droppable>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Confirm Deletion"
      >
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Are you sure?</h3>
              <p className="text-gray-400 text-sm">
                This action cannot be undone. All content within this {confirmDelete?.type} will be permanently removed.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmDelete(null)}
              className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
