import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useApolloClient } from "@apollo/client";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

import {
  ADD_TRANSACTION_MUTATION,
  UPDATE_TRANSACTION_MUTATION,
} from "@/graphql/mutations";
import { GET_TRANSACTIONS, GET_SUMMARY } from "@/graphql/queries";
import {
  TransactionType,
  type Transaction,
  type TransactionInput,
  type TransactionUpdateInput,
  type AddTransactionMutationResponse,
  type UpdateTransactionMutationResponse,
} from "@/types";

// Form input types
type TransactionFormData = {
  type: TransactionType;
  amount: string;
  description?: string;
  date: string;
};

// Schema for validation
const transactionSchema = z.object({
  type: z.nativeEnum(TransactionType, {
    required_error: "Please select a transaction type",
  }),
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0;
    }, "Amount must be a positive number"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
});

interface TransactionFormProps {
  transaction?: Transaction;
  onSuccess?: () => void;
}

export function TransactionForm({
  transaction,
  onSuccess,
}: TransactionFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const apolloClient = useApolloClient();
  const isEditing = !!transaction;

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: transaction?.type || TransactionType.EXPENSE,
      amount: transaction?.amount?.toString() || "",
      description: transaction?.description || "",
      date: transaction?.date
        ? format(new Date(transaction.date), "yyyy-MM-dd")
        : format(new Date(), "yyyy-MM-dd"),
    },
    mode: "onChange",
  });

  const [addTransaction, { loading: addLoading }] = useMutation<
    AddTransactionMutationResponse,
    { input: TransactionInput }
  >(ADD_TRANSACTION_MUTATION, {
    onCompleted: () => {
      // Refetch queries to update the cache
      apolloClient.refetchQueries({
        include: [GET_TRANSACTIONS, GET_SUMMARY],
      });
      toast({
        title: "Success!",
        description: "Transaction added successfully.",
      });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/transactions");
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const [updateTransaction, { loading: updateLoading }] = useMutation<
    UpdateTransactionMutationResponse,
    { id: string; input: TransactionUpdateInput }
  >(UPDATE_TRANSACTION_MUTATION, {
    onCompleted: () => {
      // Refetch queries to update the cache
      apolloClient.refetchQueries({
        include: [GET_TRANSACTIONS, GET_SUMMARY],
      });
      toast({
        title: "Success!",
        description: "Transaction updated successfully.",
      });
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/transactions");
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const loading = addLoading || updateLoading;

  const onSubmit = async (data: TransactionFormData) => {
    try {
      const input = {
        type: data.type,
        amount: parseFloat(data.amount),
        description: data.description || undefined,
        date: data.date,
      };

      if (isEditing && transaction) {
        await updateTransaction({
          variables: {
            id: transaction.id,
            input,
          },
        });
      } else {
        await addTransaction({
          variables: {
            input,
          },
        });
      }
    } catch (error) {
      console.error("Transaction form error:", error);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isEditing ? "Edit Transaction" : "Add New Transaction"}
        </CardTitle>
        <CardDescription>
          {isEditing
            ? "Update the transaction details below."
            : "Enter the details for your new transaction."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField<TransactionFormData>
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={loading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select transaction type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={TransactionType.INCOME}>
                          Income
                        </SelectItem>
                        <SelectItem value={TransactionType.EXPENSE}>
                          Expense
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField<TransactionFormData>
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField<TransactionFormData>
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField<TransactionFormData>
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter a description for this transaction..."
                      className="resize-none"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Update Transaction" : "Add Transaction"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/transactions")}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
