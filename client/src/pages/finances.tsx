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
import { Plus, TrendingUp, TrendingDown, DollarSign, Receipt } from "lucide-react";
import { useWorkspace } from "@/lib/workspace-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/dateUtils";
import type { Payment, Expense, Client, Project, InsertPayment, InsertExpense } from "@shared/schema";

const expenseCategories = [
    "Software", "Hardware", "Office", "Travel", "Marketing", "Sales", "Utilities", "Other"
];

export default function Finances() {
    const { currentWorkspace } = useWorkspace();
    const { toast } = useToast();
    const [view, setView] = useState<"payments" | "expenses">("payments");
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);

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

    const totalPayments = payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const totalExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
    const netProfit = totalPayments - totalExpenses;

    if (!currentWorkspace) {
        return <div className="p-8 text-center text-muted-foreground">Select a workspace</div>;
    }

    return (
        <div className="p-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">💰 Finances</h1>
                <p className="text-muted-foreground">Track payments and expenses</p>
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
                        <DollarSign className="h-4 w-4" />
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
                            onClose={() => setIsPaymentDialogOpen(false)}
                        />
                    ) : (
                        <ExpenseDialog
                            workspaceId={currentWorkspace.id}
                            projects={projects || []}
                            onClose={() => setIsExpenseDialogOpen(false)}
                        />
                    )}
                </div>

                <TabsContent value="payments" className="space-y-4">
                    {payments?.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center text-muted-foreground">
                                No payments yet. Add your first payment!
                            </CardContent>
                        </Card>
                    ) : (
                        payments?.map((payment) => (
                            <Card key={payment.id}>
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="font-semibold">₹{payment.amount}</div>
                                            <div className="text-sm text-muted-foreground">{payment.description}</div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {formatDate(payment.paymentDate)} • {payment.paymentMethod}
                                            </div>
                                        </div>
                                        <Badge variant="default">{payment.status}</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>

                <TabsContent value="expenses" className="space-y-4">
                    {expenses?.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center text-muted-foreground">
                                No expenses yet. Add your first expense!
                            </CardContent>
                        </Card>
                    ) : (
                        expenses?.map((expense) => (
                            <Card key={expense.id}>
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="font-semibold">₹{expense.amount}</div>
                                            <div className="text-sm text-muted-foreground">{expense.description}</div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {formatDate(expense.expenseDate)} • {expense.vendor}
                                            </div>
                                        </div>
                                        <Badge>{expense.category}</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}

function PaymentDialog({ workspaceId, clients, projects, onClose }: any) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [clientId, setClientId] = useState("");
    const [projectId, setProjectId] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

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
        },
    });

    const handleSubmit = () => {
        createMutation.mutate({
            workspaceId,
            amount: parseFloat(amount),
            description,
            clientId: clientId || null,
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
                    <Select value={clientId} onValueChange={setClientId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select client (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                            {clients.map((c: Client) => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                    />
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit}>Add Payment</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ExpenseDialog({ workspaceId, projects, onClose }: any) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("Software");
    const [vendor, setVendor] = useState("");
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
            projectId: null,
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
                    <Button onClick={handleSubmit}>Add Expense</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
