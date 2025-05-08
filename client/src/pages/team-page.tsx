import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Team, TeamMember, insertTeamSchema } from "@shared/schema";
import { Helmet } from "react-helmet";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  UserPlus, 
  Plus, 
  Settings, 
  Trash2, 
  LogOut, 
  Crown, 
  ShieldCheck, 
  User 
} from "lucide-react";

const teamSchema = insertTeamSchema.pick({
  name: true,
});

type TeamFormValues = z.infer<typeof teamSchema>;

const memberSchema = z.object({
  username: z.string().min(1, "Username is required"),
  role: z.enum(["member", "admin"]).default("member"),
});

type MemberFormValues = z.infer<typeof memberSchema>;

type TeamWithMembers = Team & {
  members?: Array<TeamMember & { user?: Partial<User> }>;
};

interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  avatar?: string;
}

function RoleBadge({ role }: { role: string }) {
  if (role === "owner") {
    return (
      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
        <Crown className="h-3 w-3 mr-1" />
        Owner
      </div>
    );
  } else if (role === "admin") {
    return (
      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
        <ShieldCheck className="h-3 w-3 mr-1" />
        Admin
      </div>
    );
  } else {
    return (
      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <User className="h-3 w-3 mr-1" />
        Member
      </div>
    );
  }
}

function TeamCard({ team, onSelect }: { team: Team; onSelect: () => void }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center mr-4">
            <Users className="h-6 w-6 text-primary-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-gray-900">{team.name}</h3>
            <p className="text-sm text-gray-500">
              Created on {new Date(team.createdAt).toLocaleDateString()}
            </p>
          </div>
          <Button onClick={onSelect}>Manage</Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TeamMemberItem({ 
  member, 
  teamId, 
  isOwner, 
  currentUserId 
}: { 
  member: TeamMember & { user?: Partial<User> }; 
  teamId: number;
  isOwner: boolean;
  currentUserId: number;
}) {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/teams/${teamId}/members/${member.userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${teamId}/members`] });
      toast({
        title: "Member removed",
        description: `${member.user?.username || "User"} has been removed from the team.`,
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  return (
    <div className="py-4 flex justify-between items-center">
      <div className="flex items-center">
        <Avatar className="h-10 w-10 mr-4">
          <AvatarImage src={member.user?.avatar} />
          <AvatarFallback>
            {member.user?.fullName?.charAt(0) || member.user?.username?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">{member.user?.fullName || member.user?.username}</div>
          <div className="text-sm text-gray-500">{member.user?.email}</div>
        </div>
      </div>
      
      <div className="flex items-center">
        <RoleBadge role={member.role} />
        
        {(isOwner || member.userId === currentUserId) && member.role !== "owner" && (
          <Button
            variant="ghost" 
            size="sm"
            className="ml-2"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            {member.userId === currentUserId ? (
              <LogOut className="h-4 w-4 text-gray-500" />
            ) : (
              <Trash2 className="h-4 w-4 text-gray-500" />
            )}
          </Button>
        )}
      </div>
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {member.userId === currentUserId ? "Leave Team" : "Remove Member"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500">
              {member.userId === currentUserId
                ? "Are you sure you want to leave this team?"
                : `Are you sure you want to remove ${member.user?.username || "this user"} from the team?`}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Processing..." : (member.userId === currentUserId ? "Leave" : "Remove")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TeamPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTeam, setSelectedTeam] = useState<TeamWithMembers | null>(null);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  
  const { data: teams = [], isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams"],
  });
  
  const { data: teamMembers = [], isLoading: membersLoading } = useQuery<Array<TeamMember & { user?: Partial<User> }>>({
    queryKey: [`/api/teams/${selectedTeam?.id}/members`],
    enabled: !!selectedTeam,
  });
  
  if (selectedTeam) {
    selectedTeam.members = teamMembers;
  }
  
  const teamForm = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues: {
      name: "",
    },
  });
  
  const memberForm = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      username: "",
      role: "member",
    },
  });
  
  const createTeamMutation = useMutation({
    mutationFn: async (data: TeamFormValues) => {
      const res = await apiRequest("POST", "/api/teams", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams"] });
      toast({
        title: "Team created",
        description: "Your team has been created successfully.",
      });
      teamForm.reset();
      setIsCreateTeamOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const addMemberMutation = useMutation({
    mutationFn: async (data: MemberFormValues) => {
      const res = await apiRequest("POST", `/api/teams/${selectedTeam?.id}/members`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/teams/${selectedTeam?.id}/members`] });
      toast({
        title: "Member added",
        description: "The user has been added to your team.",
      });
      memberForm.reset();
      setIsAddMemberOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onCreateTeam = (data: TeamFormValues) => {
    createTeamMutation.mutate(data);
  };
  
  const onAddMember = (data: MemberFormValues) => {
    addMemberMutation.mutate(data);
  };
  
  const isTeamOwner = selectedTeam?.ownerId === user?.id;
  
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Helmet>
        <title>Team Management | Fund Pilot</title>
        <meta name="description" content="Collaborate with your team members on financial management." />
      </Helmet>
      
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />
        
        <div className="flex-1 overflow-y-auto py-6 px-4 sm:px-6 lg:px-8">
          {selectedTeam ? (
            <>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <Button 
                    variant="ghost" 
                    className="mb-2"
                    onClick={() => setSelectedTeam(null)}
                  >
                    ← Back to Teams
                  </Button>
                  <h1 className="text-2xl font-semibold text-gray-900">{selectedTeam.name}</h1>
                </div>
                
                {isTeamOwner && (
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Team Settings
                  </Button>
                )}
              </div>
              
              <Tabs defaultValue="members">
                <TabsList className="mb-6">
                  <TabsTrigger value="members">Members</TabsTrigger>
                  <TabsTrigger value="transactions">Transactions</TabsTrigger>
                  <TabsTrigger value="reports">Reports</TabsTrigger>
                </TabsList>
                
                <TabsContent value="members">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Team Members</CardTitle>
                        <CardDescription>
                          Manage the members of your team
                        </CardDescription>
                      </div>
                      
                      {isTeamOwner && (
                        <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                          <DialogTrigger asChild>
                            <Button>
                              <UserPlus className="h-4 w-4 mr-2" />
                              Add Member
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Team Member</DialogTitle>
                            </DialogHeader>
                            <Form {...memberForm}>
                              <form onSubmit={memberForm.handleSubmit(onAddMember)} className="space-y-4 py-4">
                                <FormField
                                  control={memberForm.control}
                                  name="username"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Username</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Enter username" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <div className="space-y-2">
                                  <Label>Role</Label>
                                  <div className="flex items-center space-x-4">
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                      <input 
                                        type="radio" 
                                        value="member" 
                                        checked={memberForm.watch("role") === "member"}
                                        onChange={() => memberForm.setValue("role", "member")}
                                        className="text-primary-500 focus:ring-primary-500"
                                      />
                                      <span>Member</span>
                                    </label>
                                    
                                    <label className="flex items-center space-x-2 cursor-pointer">
                                      <input 
                                        type="radio" 
                                        value="admin" 
                                        checked={memberForm.watch("role") === "admin"}
                                        onChange={() => memberForm.setValue("role", "admin")}
                                        className="text-primary-500 focus:ring-primary-500"
                                      />
                                      <span>Admin</span>
                                    </label>
                                  </div>
                                </div>
                                
                                <DialogFooter>
                                  <Button type="submit" disabled={addMemberMutation.isPending}>
                                    {addMemberMutation.isPending ? "Adding..." : "Add Member"}
                                  </Button>
                                </DialogFooter>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                      )}
                    </CardHeader>
                    <CardContent>
                      {membersLoading ? (
                        <div className="space-y-4">
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                        </div>
                      ) : teamMembers.length === 0 ? (
                        <div className="text-center py-6">
                          <Users className="h-12 w-12 mx-auto text-gray-400" />
                          <p className="mt-2 text-gray-500">No team members yet</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-200">
                          {teamMembers.map((member) => (
                            <TeamMemberItem 
                              key={member.id} 
                              member={member} 
                              teamId={selectedTeam.id}
                              isOwner={isTeamOwner}
                              currentUserId={user?.id || 0}
                            />
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="transactions">
                  <Card>
                    <CardHeader>
                      <CardTitle>Team Transactions</CardTitle>
                      <CardDescription>
                        View and manage financial transactions for the team
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center py-12">
                      <p className="text-gray-500">Team transactions feature coming soon</p>
                      <p className="text-sm text-gray-400 mt-2">Available in Pro version</p>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="reports">
                  <Card>
                    <CardHeader>
                      <CardTitle>Team Reports</CardTitle>
                      <CardDescription>
                        Generate and view team financial reports
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center py-12">
                      <p className="text-gray-500">Team reports feature coming soon</p>
                      <p className="text-sm text-gray-400 mt-2">Available in Pro version</p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <>
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Teams</h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Collaborate with others on financial planning and tracking
                  </p>
                </div>
                
                <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Team
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create a New Team</DialogTitle>
                    </DialogHeader>
                    <Form {...teamForm}>
                      <form onSubmit={teamForm.handleSubmit(onCreateTeam)} className="space-y-4 py-4">
                        <FormField
                          control={teamForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Team Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter team name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <DialogFooter>
                          <Button type="submit" disabled={createTeamMutation.isPending}>
                            {createTeamMutation.isPending ? "Creating..." : "Create Team"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="space-y-4">
                {teamsLoading ? (
                  <>
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </>
                ) : teams.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Teams Yet</h3>
                      <p className="text-sm text-gray-500 mb-4">
                        Create your first team to collaborate on financial planning and tracking
                      </p>
                      <Button onClick={() => setIsCreateTeamOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Team
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <h2 className="text-lg font-medium text-gray-900 mt-2">Your Teams</h2>
                    <div className="space-y-4">
                      {teams.map((team) => (
                        <TeamCard 
                          key={team.id} 
                          team={team} 
                          onSelect={() => setSelectedTeam(team)} 
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              
              <Separator className="my-8" />
              
              <div className="bg-blue-50 rounded-lg p-6">
                <div className="flex items-start">
                  <div className="bg-blue-100 p-3 rounded-lg mr-4">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Upgrade to Pro for Team Features</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Get access to advanced team collaboration features, including shared budgets, financial reports, and more.
                    </p>
                    <Button className="mt-4" variant="primary">
                      Upgrade to Pro
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
}
