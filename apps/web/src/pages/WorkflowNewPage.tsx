import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import clsx from "clsx";
import { workflowApi } from "../api/endpoints";
import { apiError } from "../api/client";
import { Icon } from "../components/Icon";
import { Spinner } from "../components/Spinner";
import type { TriggerType } from "../types";

interface Form {
  name: string;
  description: string;
}

export default function WorkflowNewPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [trigger, setTrigger] = useState<TriggerType>("manual");
  const { register, handleSubmit, formState: { errors } } = useForm<Form>();

  const create = useMutation({
    mutationFn: (data: Form) =>
      workflowApi.create({
        name: data.name,
        description: data.description,
        trigger_type: trigger,
        steps: [],
      }),
    onSuccess: (wf) => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow created — now add some steps!");
      navigate(`/workflows/${wf.id}`);
    },
    onError: (e) => toast.error(apiError(e, "Could not create workflow")),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link to="/workflows" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
        ← Back to workflows
      </Link>

      <div className="card p-6">
        <h2 className="text-xl font-bold text-slate-900">Create a workflow</h2>
        <p className="mt-1 text-sm text-slate-500">
          Give it a name and pick how it will be triggered. You'll add steps next.
        </p>

        <form onSubmit={handleSubmit((d) => create.mutate(d))} className="mt-6 space-y-5">
          <div>
            <label className="label">Workflow name</label>
            <input
              className="input"
              placeholder="e.g. Customer Feedback Triage"
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              className="input min-h-[80px]"
              placeholder="What does this workflow do?"
              {...register("description")}
            />
          </div>

          <div>
            <label className="label">Trigger type</label>
            <div className="grid grid-cols-2 gap-3">
              {(["manual", "webhook"] as TriggerType[]).map((t) => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTrigger(t)}
                  className={clsx(
                    "flex items-start gap-3 rounded-lg border p-4 text-left transition-colors",
                    trigger === t
                      ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <span
                    className={clsx(
                      "flex h-9 w-9 items-center justify-center rounded-lg",
                      trigger === t ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-500"
                    )}
                  >
                    <Icon name={t === "webhook" ? "webhook" : "play"} width={18} height={18} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold capitalize text-slate-800">{t}</p>
                    <p className="text-xs text-slate-500">
                      {t === "manual"
                        ? "Run on demand from the dashboard."
                        : "Trigger via a unique webhook URL."}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Link to="/workflows" className="btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn-primary" disabled={create.isPending}>
              {create.isPending ? <Spinner className="h-4 w-4 text-white" /> : <Icon name="plus" width={16} height={16} />}
              Create workflow
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
