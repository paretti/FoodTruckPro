import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Users, Truck, UserPlus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const organizationSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
});

const teamMemberSchema = z.object({
  userId: z.string().min(1, "Employee ID is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  truckId: z.number().optional(),
  role: z.enum(["admin", "manager", "member"]),
});

const truckSchema = z.object({
  name: z.string().min(1, "Truck name is required"),
  description: z.string().optional(),
  cuisine: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
});

type OrganizationFormData = z.infer<typeof organizationSchema>;
type TeamMemberFormData = z.infer<typeof teamMemberSchema>;
type TruckFormData = z.infer<typeof truckSchema>;

export default function Team() {
  const { toast } = useToast();
  const [isOrgDialogOpen, setIsOrgDialogOpen] = useState(false);
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [isTruckDialogOpen, setIsTruckDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);

  // Get user's organization and team data
  const { data: organization } = useQuery({
    queryKey: ["/api/organization"],
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["/api/team-members", organization?.id],
    enabled: !!organization?.id,
  });

  const { data: trucks = [] } = useQuery({
    queryKey: ["/api/trucks", organization?.id],
    enabled: !!organization?.id,
  });

  const orgForm = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: { name: "" },
  });

  const memberForm = useForm<TeamMemberFormData>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: { 
      userId: "", 
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "member" 
    },
  });

  const truckForm = useForm<TruckFormData>({
    resolver: zodResolver(truckSchema),
    defaultValues: { name: "", description: "", cuisine: "", phone: "", website: "" },
  });

  const createOrgMutation = useMutation({
    mutationFn: async (data: OrganizationFormData) => {
      const response = await apiRequest("POST", "/api/organization", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organization"] });
      setIsOrgDialogOpen(false);
      orgForm.reset();
      toast({
        title: "Success",
        description: "Organization created successfully",
      });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async (data: TeamMemberFormData) => {
      const response = await apiRequest("POST", "/api/team-members", {
        ...data,
        organizationId: organization?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      setIsMemberDialogOpen(false);
      memberForm.reset();
      toast({
        title: "Success",
        description: "Team member added successfully",
      });
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: TeamMemberFormData }) => {
      const response = await apiRequest("PUT", `/api/team-members/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      setEditingMember(null);
      setIsMemberDialogOpen(false);
      memberForm.reset();
      toast({
        title: "Success",
        description: "Team member updated successfully",
      });
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/team-members/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team-members"] });
      toast({
        title: "Success",
        description: "Team member deleted successfully",
      });
    },
  });

  const createTruckMutation = useMutation({
    mutationFn: async (data: TruckFormData) => {
      const response = await apiRequest("POST", "/api/trucks", {
        ...data,
        organizationId: organization?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trucks", organization?.id] });
      setIsTruckDialogOpen(false);
      truckForm.reset();
      toast({
        title: "Success",
        description: "Truck added successfully",
      });
    },
  });

  if (!organization) {
    return (
      <div>
        {/* Header */}
        <header className="bg-white border-b border-border px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Team Management</h1>
              <p className="text-muted-foreground">
                Create your organization and manage your food truck team.
              </p>
            </div>
          </div>
        </header>

        <main className="p-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Create Organization</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Start by creating your organization to manage multiple food trucks and team members.
              </p>
              <Dialog open={isOrgDialogOpen} onOpenChange={setIsOrgDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Organization
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Organization</DialogTitle>
                  </DialogHeader>
                  <Form {...orgForm}>
                    <form onSubmit={orgForm.handleSubmit((data) => createOrgMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={orgForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Organization Name</FormLabel>
                            <FormControl>
                              <Input placeholder="My Food Truck Company" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsOrgDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          className="bg-primary hover:bg-primary/90"
                          disabled={createOrgMutation.isPending}
                        >
                          Create Organization
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <header className="bg-white border-b border-border px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Team Management</h1>
            <p className="text-muted-foreground">
              Manage your {organization.name} team and food trucks.
            </p>
          </div>
        </div>
      </header>

      <main className="p-8">
        {/* Organization Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Users className="h-5 w-5 mr-2 text-primary" />
                Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold text-foreground">{teamMembers.length}</span>
              <p className="text-sm text-muted-foreground mt-2">Active team members</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Truck className="h-5 w-5 mr-2 text-secondary" />
                Food Trucks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold text-foreground">{trucks.length}</span>
              <p className="text-sm text-muted-foreground mt-2">Trucks in fleet</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Organization</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-medium text-foreground">{organization.name}</p>
              <p className="text-sm text-muted-foreground mt-2">Owner organization</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Team Members */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Team Members</CardTitle>
                <Dialog open={isMemberDialogOpen} onOpenChange={(open) => {
                  setIsMemberDialogOpen(open);
                  if (!open) {
                    setEditingMember(null);
                    memberForm.reset();
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-primary hover:bg-primary/90">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingMember ? "Edit Team Member" : "Add Team Member"}</DialogTitle>
                    </DialogHeader>
                    <Form {...memberForm}>
                      <form onSubmit={memberForm.handleSubmit((data) => {
                        if (editingMember) {
                          updateMemberMutation.mutate({ id: editingMember.id, data });
                        } else {
                          addMemberMutation.mutate(data);
                        }
                      })} className="space-y-4">
                        <FormField
                          control={memberForm.control}
                          name="userId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Employee ID</FormLabel>
                              <FormControl>
                                <Input placeholder="EMP001" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={memberForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="John" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={memberForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Doe" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={memberForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email (Optional)</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="john.doe@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={memberForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="(555) 123-4567" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={memberForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Role</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="manager">Manager</SelectItem>
                                  <SelectItem value="member">Member</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={memberForm.control}
                          name="truckId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Assigned Truck (Optional)</FormLabel>
                              <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select truck" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {trucks.map((truck: any) => (
                                    <SelectItem key={truck.id} value={truck.id.toString()}>
                                      {truck.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsMemberDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            className="bg-primary hover:bg-primary/90"
                            disabled={addMemberMutation.isPending}
                          >
                            Add Member
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {teamMembers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No team members</h3>
                  <p className="text-muted-foreground mb-6">
                    Add team members to assign them to specific trucks.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {teamMembers.map((member: any) => (
                    <div key={member.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-foreground">
                              {member.firstName} {member.lastName}
                            </h3>
                            <Badge variant={member.role === "admin" ? "default" : "secondary"}>
                              {member.role}
                            </Badge>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>Employee ID: {member.userId}</p>
                            {member.email && <p>Email: {member.email}</p>}
                            {member.phone && <p>Phone: {member.phone}</p>}
                            <p>
                              {member.truckId 
                                ? `Assigned to Truck ${member.truckId}` 
                                : "No truck assigned"
                              }
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingMember(member);
                              memberForm.reset({
                                userId: member.userId,
                                firstName: member.firstName,
                                lastName: member.lastName,
                                email: member.email || "",
                                phone: member.phone || "",
                                role: member.role,
                                truckId: member.truckId,
                              });
                              setIsMemberDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (window.confirm("Are you sure you want to delete this team member?")) {
                                deleteMemberMutation.mutate(member.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Food Trucks */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Food Trucks</CardTitle>
                <Dialog open={isTruckDialogOpen} onOpenChange={setIsTruckDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-primary hover:bg-primary/90">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Truck
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Food Truck</DialogTitle>
                    </DialogHeader>
                    <Form {...truckForm}>
                      <form onSubmit={truckForm.handleSubmit((data) => createTruckMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={truckForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Truck Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Taco Express" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={truckForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Input placeholder="Authentic Mexican street food" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={truckForm.control}
                          name="cuisine"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cuisine Type</FormLabel>
                              <FormControl>
                                <Input placeholder="Mexican" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsTruckDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            className="bg-primary hover:bg-primary/90"
                            disabled={createTruckMutation.isPending}
                          >
                            Add Truck
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {trucks.length === 0 ? (
                <div className="text-center py-8">
                  <Truck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No trucks</h3>
                  <p className="text-muted-foreground mb-6">
                    Add food trucks to your fleet to start managing operations.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {trucks.map((truck: any) => (
                    <div key={truck.id} className="p-4 border rounded-lg">
                      <h4 className="font-medium text-foreground">{truck.name}</h4>
                      <p className="text-sm text-muted-foreground">{truck.description}</p>
                      {truck.cuisine && (
                        <Badge variant="outline" className="mt-2">
                          {truck.cuisine}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}