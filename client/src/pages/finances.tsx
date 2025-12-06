import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, TrendingUp, TrendingDown, IndianRupee, Trash2, ArrowUpDown, Pencil } from "lucide-react";
import { useWorkspace } from "@/lib/workspace-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/dateUtils";
import type { Payment, Expense, Client, Project, InsertPayment, InsertExpense } from "@shared/schema";

const expenseCategories = [
    "Software", "Hardware", "Office", "Travel", "Marketing", "Sales", "Utilities", "Other"
];

type SortField = "date" | "amount";
type SortDirection = "asc" | "desc";

export default function Finances() {
    const { currentWorkspace } = useWorkspace();
    const { toast } = useToast();
    const [view, setView] = useState<"payments" | "expenses">("payments");
    const [paymentSort, setPaymentSort] = useState<{ field: SortField; dir: SortDirection }>({ field: "date", dir: "desc" });
    const [expenseSort, setExpenseSort] = useState<{ field: SortField; dir: SortDirection }>({ field: "date", dir: "desc" });

    // Filter states for payments
    const [projectFilter, setProjectFilter] = useState<string>("all");
    const [methodFilter, setMethodFilter] = useState<string>("all");

    // Filter states for expenses
    const [expenseProjectFilter, setExpenseProjectFilter] = useState<string>("all");
    const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>("all");

    const { data: payments } = useQuery<Payment[]>({
        queryKey: [`/api/payments?workspaceId=${currentWorkspace?.id}`],
        enabled: !!currentWorkspace,
    });

    const { data: expenses } = useQuery<Expense[]>({
        queryKey: [`/api/expenses?workspaceId=${currentWorkspace?.id}`],
        enabled: !!currentWorkspace,
    });

    const { data: clients } = useQuery<Client[]>({
        queryKey: [`/api/clients?workspaceId=${currentWorkspace?.id}`],
        enabled: !!currentWorkspace,
    });

    const { data: projects } = useQuery<Project[]>({
        queryKey: [`/api/projects?workspaceId=${currentWorkspace?.id}`],
        enabled: !!currentWorkspace,
    });

    const deletePaymentMutation = useMutation({
        mutationFn: async (id: string) => apiRequest("DELETE", `/api/payments/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/payments?workspaceId=${currentWorkspace?.id}`] });
            toast({ title: "Payment deleted" });
        },
    });

    const deleteExpenseMutation = useMutation({
        mutationFn: async (id: string) => apiRequest("DELETE", `/api/expenses/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/expenses?workspaceId=${currentWorkspace?.id}`] });
            toast({ title: "Expense deleted" });
        },
    });

    // Edit states
    const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

    // Filter and sort payments
    const filteredPayments = (payments || []).filter(p => {
        if (projectFilter !== "all" && p.projectId !== projectFilter) return false;
        if (methodFilter !== "all" && p.paymentMethod !== methodFilter) return false;
        return true;
    });

    const sortedPayments = [...filteredPayments].sort((a, b) => {
        const multiplier = paymentSort.dir === "asc" ? 1 : -1;
        if (paymentSort.field === "date") {
            return multiplier * (new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime());
        }
        return multiplier * (a.amount - b.amount);
    });

    // Filter and sort expenses
    const filteredExpenses = (expenses || []).filter(e => {
        if (expenseProjectFilter !== "all" && e.projectId !== expenseProjectFilter) return false;
        if (expenseCategoryFilter !== "all" && e.category !== expenseCategoryFilter) return false;
        return true;
    });

    const sortedExpenses = [...filteredExpenses].sort((a, b) => {
        const multiplier = expenseSort.dir === "asc" ? 1 : -1;
        if (expenseSort.field === "date") {
            return multiplier * (new Date(a.expenseDate).getTime() - new Date(b.expenseDate).getTime());
        }
        return multiplier * (a.amount - b.amount);
    });

    const togglePaymentSort = (field: SortField) => {
        setPaymentSort(prev => ({
            field,
            dir: prev.field === field && prev.dir === "desc" ? "asc" : "desc"
        }));
    };

    const toggleExpenseSort = (field: SortField) => {
        setExpenseSort(prev => ({
            field,
            dir: prev.field === field && prev.dir === "desc" ? "asc" : "desc"
        }));
    };

    // Get unique payment methods from data
    const paymentMethods = Array.from(new Set(payments?.map(p => p.paymentMethod) || []));

    // Get projects that have payments
    const projectsWithPayments = projects?.filter(p =>
        payments?.some(pay => pay.projectId === p.id)
    ) || [];

    // Get projects that have expenses
    const projectsWithExpenses = projects?.filter(p =>
        expenses?.some(exp => exp.projectId === p.id)
    ) || [];

    // Get unique expense categories from data
    const usedCategories = Array.from(new Set(expenses?.map(e => e.category).filter(Boolean) || []));

    const totalPayments = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
    const netProfit = totalPayments - totalExpenses;

    // Filtered totals
    const filteredPaymentTotal = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    const filteredExpenseTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    if (!currentWorkspace) {
        return <div className="p-8 text-center text-muted-foreground">Select a workspace</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold">💰 Finances</h1>
                <p className="text-muted-foreground text-sm sm:text-base">Track payments and expenses</p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">₹{totalPayments.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">{payments?.length || 0} transactions</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">₹{totalExpenses.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">{expenses?.length || 0} transactions</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                        <IndianRupee className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₹{netProfit.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {netProfit >= 0 ? 'Profit' : 'Loss'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={view} onValueChange={(v) => setView(v as any)}>
                <div className="flex justify-between items-center">
                    <TabsList>
                        <TabsTrigger value="payments">Payments</TabsTrigger>
                        <TabsTrigger value="expenses">Expenses</TabsTrigger>
                    </TabsList>

                    {view === "payments" ? (
                        <PaymentDialog
                            workspaceId={currentWorkspace.id}
                            clients={clients || []}
                            projects={projects || []}
                        />
                    ) : (
                        <ExpenseDialog
                            workspaceId={currentWorkspace.id}
                            projects={projects || []}
                        />
                    )}
                </div>

                <TabsContent value="payments" className="space-y-4">
                    {/* Filters and Sort */}
                    <div className="flex flex-wrap gap-2 items-center">
                        <Select value={projectFilter} onValueChange={setProjectFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by project" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Projects</SelectItem>
                                {projectsWithPayments.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={methodFilter} onValueChange={setMethodFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Methods</SelectItem>
                                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                <SelectItem value="upi">UPI</SelectItem>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="cheque">Cheque</SelectItem>
                                <SelectItem value="card">Card</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex-1" />

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => togglePaymentSort("date")}
                            className={paymentSort.field === "date" ? "bg-accent" : ""}
                        >
                            <ArrowUpDown className="h-4 w-4 mr-1" />
                            Date {paymentSort.field === "date" && (paymentSort.dir === "asc" ? "↑" : "↓")}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => togglePaymentSort("amount")}
                            className={paymentSort.field === "amount" ? "bg-accent" : ""}
                        >
                            <ArrowUpDown className="h-4 w-4 mr-1" />
                            Amount {paymentSort.field === "amount" && (paymentSort.dir === "asc" ? "↑" : "↓")}
                        </Button>
                    </div>

                    {/* Filtered total indicator */}
                    {(projectFilter !== "all" || methodFilter !== "all") && (
                        <div className="text-sm text-muted-foreground">
                            Showing <span className="font-semibold text-green-600">₹{filteredPaymentTotal.toFixed(2)}</span> from {filteredPayments.length} filtered payments
                        </div>
                    )}

                    {sortedPayments.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center text-muted-foreground">
                                No payments yet. Add your first payment!
                            </CardContent>
                        </Card>
                    ) : (
                        sortedPayments.map((payment) => (
                            <Card key={payment.id}>
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="font-semibold text-green-600">₹{payment.amount}</div>
                                            <div className="text-sm text-muted-foreground">{payment.description}</div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {formatDate(payment.paymentDate)} • {payment.paymentMethod}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="default">{payment.status}</Badge>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => setEditingPayment(payment)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                onClick={() => deletePaymentMutation.mutate(payment.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>

                <TabsContent value="expenses" className="space-y-4">
                    {/* Filters and Sort */}
                    <div className="flex flex-wrap gap-2 items-center">
                        <Select value={expenseProjectFilter} onValueChange={setExpenseProjectFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by project" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Projects</SelectItem>
                                {projectsWithExpenses.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={expenseCategoryFilter} onValueChange={setExpenseCategoryFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {expenseCategories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <div className="flex-1" />

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleExpenseSort("date")}
                            className={expenseSort.field === "date" ? "bg-accent" : ""}
                        >
                            <ArrowUpDown className="h-4 w-4 mr-1" />
                            Date {expenseSort.field === "date" && (expenseSort.dir === "asc" ? "↑" : "↓")}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleExpenseSort("amount")}
                            className={expenseSort.field === "amount" ? "bg-accent" : ""}
                        >
                            <ArrowUpDown className="h-4 w-4 mr-1" />
                            Amount {expenseSort.field === "amount" && (expenseSort.dir === "asc" ? "↑" : "↓")}
                        </Button>
                    </div>

                    {/* Filtered total indicator */}
                    {(expenseProjectFilter !== "all" || expenseCategoryFilter !== "all") && (
                        <div className="text-sm text-muted-foreground">
                            Showing <span className="font-semibold text-red-600">₹{filteredExpenseTotal.toFixed(2)}</span> from {filteredExpenses.length} filtered expenses
                        </div>
                    )}

                    {sortedExpenses.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center text-muted-foreground">
                                No expenses yet. Add your first expense!
                            </CardContent>
                        </Card>
                    ) : (
                        sortedExpenses.map((expense) => (
                            <Card key={expense.id}>
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="font-semibold text-red-600">₹{expense.amount}</div>
                                            <div className="text-sm text-muted-foreground">{expense.description}</div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {formatDate(expense.expenseDate)} • {expense.vendor}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge>{expense.category}</Badge>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => setEditingExpense(expense)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                onClick={() => deleteExpenseMutation.mutate(expense.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>
            </Tabs>

            {/* Edit Payment Dialog */}
            {editingPayment && (
                <EditPaymentDialog
                    payment={editingPayment}
                    workspaceId={currentWorkspace.id}
                    clients={clients || []}
                    projects={projects || []}
                    onClose={() => setEditingPayment(null)}
                />
            )}

            {/* Edit Expense Dialog */}
            {editingExpense && (
                <EditExpenseDialog
                    expense={editingExpense}
                    workspaceId={currentWorkspace.id}
                    projects={projects || []}
                    onClose={() => setEditingExpense(null)}
                />
            )}
        </div>
    );
}

function PaymentDialog({ workspaceId, clients, projects }: { workspaceId: string; clients: Client[]; projects: Project[] }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [projectId, setProjectId] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

    // Get clientId from selected project
    const selectedProject = projects.find(p => p.id === projectId);
    const clientId = selectedProject?.clientId || null;

    const createMutation = useMutation({
        mutationFn: async (data: InsertPayment) => {
            return apiRequest("POST", "/api/payments", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/payments?workspaceId=${workspaceId}`] });
            toast({ title: "Payment added!" });
            setOpen(false);
            setAmount("");
            setDescription("");
            setProjectId("");
        },
    });

    const handleSubmit = () => {
        createMutation.mutate({
            workspaceId,
            amount: parseFloat(amount),
            description,
            clientId,
            projectId: projectId || null,
            paymentMethod,
            paymentDate: new Date(paymentDate),
            status: "received",
            currency: "INR",
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Add Payment</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Payment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <Input
                        type="number"
                        placeholder="Amount (₹)"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                    <Textarea
                        placeholder="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <Select value={projectId} onValueChange={setProjectId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select project (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                            {projects.map((p: Project) => {
                                const client = clients.find(c => c.id === p.clientId);
                                return (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.name} {client && `(${client.name})`}
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger>
                            <SelectValue placeholder="Payment method" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="upi">UPI</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={!amount}>Add Payment</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ExpenseDialog({ workspaceId, projects }: { workspaceId: string; projects: Project[] }) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("Software");
    const [vendor, setVendor] = useState("");
    const [projectId, setProjectId] = useState("");
    const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

    const createMutation = useMutation({
        mutationFn: async (data: InsertExpense) => {
            return apiRequest("POST", "/api/expenses", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/expenses?workspaceId=${workspaceId}`] });
            toast({ title: "Expense added!" });
            setOpen(false);
            setAmount("");
            setDescription("");
            setProjectId("");
        },
    });

    const handleSubmit = () => {
        createMutation.mutate({
            workspaceId,
            amount: parseFloat(amount),
            description,
            category,
            vendor,
            expenseDate: new Date(expenseDate),
            currency: "INR",
            projectId: projectId || null,
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Add Expense</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Expense</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <Input
                        type="number"
                        placeholder="Amount (₹)"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                    <Textarea
                        placeholder="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <Select value={projectId} onValueChange={setProjectId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select project (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                            {projects.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {expenseCategories.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input
                        placeholder="Vendor"
                        value={vendor}
                        onChange={(e) => setVendor(e.target.value)}
                    />
                    <Input
                        type="date"
                        value={expenseDate}
                        onChange={(e) => setExpenseDate(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={!amount}>Add Expense</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function EditPaymentDialog({
    payment,
    workspaceId,
    clients,
    projects,
    onClose
}: {
    payment: Payment;
    workspaceId: string;
    clients: Client[];
    projects: Project[];
    onClose: () => void;
}) {
    const { toast } = useToast();
    const [amount, setAmount] = useState(payment.amount.toString());
    const [description, setDescription] = useState(payment.description || "");
    const [projectId, setProjectId] = useState(payment.projectId || "none");
    const [paymentMethod, setPaymentMethod] = useState(payment.paymentMethod || "bank_transfer");
    const [paymentDate, setPaymentDate] = useState(
        new Date(payment.paymentDate).toISOString().split('T')[0]
    );
    const [status, setStatus] = useState(payment.status || "received");

    // Get clientId from selected project
    const selectedProject = projects.find(p => p.id === projectId);
    const clientId = selectedProject?.clientId || null;

    const updateMutation = useMutation({
        mutationFn: async (data: Partial<Payment>) => {
            return apiRequest("PATCH", `/api/payments/${payment.id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/payments?workspaceId=${workspaceId}`] });
            toast({ title: "Payment updated!" });
            onClose();
        },
    });

    const handleSubmit = () => {
        updateMutation.mutate({
            amount: parseFloat(amount),
            description,
            clientId,
            projectId: projectId === "none" ? null : projectId,
            paymentMethod,
            paymentDate: new Date(paymentDate),
            status,
        });
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Payment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <Input
                        type="number"
                        placeholder="Amount (₹)"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                    <Textarea
                        placeholder="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <Select value={projectId} onValueChange={setProjectId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select project (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">No project</SelectItem>
                            {projects.map((p: Project) => {
                                const client = clients.find(c => c.id === p.clientId);
                                return (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.name} {client && `(${client.name})`}
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger>
                            <SelectValue placeholder="Payment method" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                            <SelectItem value="upi">UPI</SelectItem>
                            <SelectItem value="cash">Cash</SelectItem>
                            <SelectItem value="cheque">Cheque</SelectItem>
                            <SelectItem value="card">Card</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="received">Received</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={!amount}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function EditExpenseDialog({
    expense,
    workspaceId,
    projects,
    onClose
}: {
    expense: Expense;
    workspaceId: string;
    projects: Project[];
    onClose: () => void;
}) {
    const { toast } = useToast();
    const [amount, setAmount] = useState(expense.amount.toString());
    const [description, setDescription] = useState(expense.description || "");
    const [category, setCategory] = useState(expense.category || "Software");
    const [vendor, setVendor] = useState(expense.vendor || "");
    const [projectId, setProjectId] = useState(expense.projectId || "none");
    const [expenseDate, setExpenseDate] = useState(
        new Date(expense.expenseDate).toISOString().split('T')[0]
    );

    const updateMutation = useMutation({
        mutationFn: async (data: Partial<Expense>) => {
            return apiRequest("PATCH", `/api/expenses/${expense.id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [`/api/expenses?workspaceId=${workspaceId}`] });
            toast({ title: "Expense updated!" });
            onClose();
        },
    });

    const handleSubmit = () => {
        updateMutation.mutate({
            amount: parseFloat(amount),
            description,
            category,
            vendor,
            expenseDate: new Date(expenseDate),
            projectId: projectId === "none" ? null : projectId,
        });
    };

    return (
        <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Expense</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <Input
                        type="number"
                        placeholder="Amount (₹)"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                    <Textarea
                        placeholder="Description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <Select value={projectId} onValueChange={setProjectId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select project (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">No project</SelectItem>
                            {projects.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {expenseCategories.map((cat) => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input
                        placeholder="Vendor"
                        value={vendor}
                        onChange={(e) => setVendor(e.target.value)}
                    />
                    <Input
                        type="date"
                        value={expenseDate}
                        onChange={(e) => setExpenseDate(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={!amount}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
