'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Search, Check, X, Image as ImageIcon } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  photo_count: number;
}

interface MatchedPair {
  before: { id: string; url: string; messy: number };
  after: { id: string; url: string; clean: number };
  fingerprint: string;
  caption: string;
}

export default function BuildPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState<string | null>(null);
  const [pairs, setPairs] = useState<MatchedPair[]>([]);
  const [creating, setCreating] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (e) {
      console.error('Failed to fetch projects', e);
    } finally {
      setLoading(false);
    }
  }

  async function scanProject(projectId: string, projectName: string) {
    setScanning(projectId);
    setPairs([]);
    
    try {
      // Call the scan endpoint
      const res = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, projectName })
      });
      
      const data = await res.json();
      
      if (data.pairs) {
        setPairs(data.pairs);
      }
    } catch (e) {
      console.error('Scan failed', e);
    } finally {
      setScanning(null);
    }
  }

  async function createPost(pair: MatchedPair) {
    setCreating(pair.before.id);
    
    try {
      const res = await fetch('/api/match/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beforeUrl: pair.before.url,
          afterUrl: pair.after.url,
          beforeId: pair.before.id,
          afterId: pair.after.id,
          caption: pair.caption,
          fingerprint: pair.fingerprint
        })
      });
      
      if (res.ok) {
        // Remove from list
        setPairs(pairs.filter(p => p.before.id !== pair.before.id));
      }
    } catch (e) {
      console.error('Create failed', e);
    } finally {
      setCreating(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Build Content</h1>
        <p className="text-gray-500">Scan projects to find before/after pairs</p>
      </div>

      {/* Found Pairs */}
      {pairs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-500" />
              Found {pairs.length} Pairs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pairs.map((pair) => (
              <div key={pair.before.id} className="flex gap-4 p-4 border rounded-lg">
                <div className="flex gap-2">
                  <div className="text-center">
                    <img 
                      src={pair.before.url} 
                      alt="Before" 
                      className="w-32 h-32 object-cover rounded"
                    />
                    <span className="text-xs text-red-500 font-medium">
                      BEFORE ({pair.before.messy}/10)
                    </span>
                  </div>
                  <div className="text-center">
                    <img 
                      src={pair.after.url} 
                      alt="After" 
                      className="w-32 h-32 object-cover rounded"
                    />
                    <span className="text-xs text-green-500 font-medium">
                      AFTER ({pair.after.clean}/10)
                    </span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-2">{pair.fingerprint}</p>
                  <p className="font-medium">{pair.caption}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Button 
                    size="sm"
                    onClick={() => createPost(pair)}
                    disabled={creating === pair.before.id}
                  >
                    {creating === pair.before.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Queue Post'
                    )}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setPairs(pairs.filter(p => p.before.id !== pair.before.id))}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Project List */}
      <Card>
        <CardHeader>
          <CardTitle>Projects</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-2">
              {projects.map((project) => (
                <div 
                  key={project.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium">{project.name}</p>
                    <p className="text-sm text-gray-500">{project.photo_count} photos</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => scanProject(project.id, project.name)}
                    disabled={scanning === project.id}
                  >
                    {scanning === project.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Scanning...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Scan
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
