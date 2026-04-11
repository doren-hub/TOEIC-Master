/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserPlus, User, Trash2, Check, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UserData } from '@/src/hooks/useLearningStore';

interface UserManagementProps {
  users: Record<string, UserData>;
  currentUserId: string | null;
  onAddUser: (name: string) => void;
  onSwitchUser: (id: string) => void;
  onDeleteUser: (id: string) => void;
  onClose: () => void;
}

export function UserManagement({ users, currentUserId, onAddUser, onSwitchUser, onDeleteUser, onClose }: UserManagementProps) {
  const [newUserName, setNewUserName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (newUserName.trim()) {
      onAddUser(newUserName.trim());
      setNewUserName('');
      setIsAdding(false);
    }
  };

  const userList = Object.values(users);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" /> User Profiles
        </h2>
        <Button variant="ghost" onClick={onClose}>Back to Dashboard</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <AnimatePresence>
          {userList.map((user) => (
            <motion.div
              key={user.profile.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card 
                className={`relative overflow-hidden cursor-pointer transition-all hover:shadow-md border-2 ${
                  currentUserId === user.profile.id ? 'border-primary bg-primary/5' : 'border-transparent'
                }`}
                onClick={() => onSwitchUser(user.profile.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${currentUserId === user.profile.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <User size={20} />
                      </div>
                      <CardTitle className="text-lg">{user.profile.name}</CardTitle>
                    </div>
                    {currentUserId === user.profile.id && (
                      <div className="bg-primary text-white p-1 rounded-full">
                        <Check size={14} />
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Level {user.profile.targetScore}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteUser(user.profile.id);
                      }}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {!isAdding ? (
          <Button 
            variant="outline" 
            className="h-[120px] border-dashed border-2 flex flex-col gap-2 rounded-xl"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-6 w-6" />
            <span>Add New Profile</span>
          </Button>
        ) : (
          <Card className="border-dashed border-2 rounded-xl">
            <CardContent className="pt-6 space-y-4">
              <Input 
                placeholder="Enter name..." 
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleAdd}>Add</Button>
                <Button variant="ghost" className="flex-1" onClick={() => setIsAdding(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {userList.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed">
          <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <p className="text-muted-foreground">No profiles found. Create one to start learning!</p>
        </div>
      )}
    </div>
  );
}
