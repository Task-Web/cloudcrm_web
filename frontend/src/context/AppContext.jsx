import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../apiClient";
import { applyCookieFromQuery } from "../utils/cookies";

const AppContext = createContext(null);

const ID_FIELDS = {
  accounts: "accountId",
  activities: "activityId",
  cases: "caseId",
  chatterPosts: "postId",
  contacts: "contactId",
  dashboards: "dashboardId",
  files: "fileId",
  leads: "leadId",
  opportunities: "opportunityId",
  users: "userId",
};

const buildOperations = (current, partial) => {
  const operations = [];
  Object.entries(partial).forEach(([resource, nextValue]) => {
    if (resource === "user") {
      operations.push({
        resource,
        action: "update",
        record_id: current.user.userId,
        values: nextValue,
      });
      return;
    }
    if (resource === "following") {
      const previous = new Set(current.following || []);
      const next = new Set(nextValue || []);
      next.forEach((userId) => {
        if (!previous.has(userId)) {
          operations.push({ resource, action: "create", values: { userId } });
        }
      });
      previous.forEach((userId) => {
        if (!next.has(userId)) {
          operations.push({ resource, action: "delete", record_id: userId });
        }
      });
      return;
    }
    if (resource === "chatterPosts") {
      const previousById = new Map(
        (current.chatterPosts || []).map((post) => [post.postId, post])
      );
      nextValue.forEach((post) => {
        const previous = previousById.get(post.postId);
        if (!previous) {
          operations.push({ resource, action: "create_post", content: post.content });
          return;
        }
        const profileId = current.user.userId;
        const likedBefore = previous.likes.includes(profileId);
        const likedAfter = post.likes.includes(profileId);
        if (likedBefore !== likedAfter) {
          operations.push({
            resource,
            action: likedAfter ? "like_post" : "unlike_post",
            record_id: post.postId,
          });
        }
        const previousCommentIds = new Set(
          previous.comments.map((comment) => comment.commentId)
        );
        post.comments
          .filter((comment) => !previousCommentIds.has(comment.commentId))
          .forEach((comment) => {
            operations.push({
              resource,
              action: "comment",
              record_id: post.postId,
              content: comment.content,
            });
          });
      });
      return;
    }
    const idField = ID_FIELDS[resource];
    if (!idField || !Array.isArray(nextValue)) {
      throw new Error(`Unsupported CRM resource: ${resource}`);
    }
    const previousById = new Map((current[resource] || []).map((item) => [item[idField], item]));
    const nextById = new Map(nextValue.map((item) => [item[idField], item]));
    nextById.forEach((record, recordId) => {
      const previous = previousById.get(recordId);
      if (!previous) {
        operations.push({ resource, action: "create", values: record });
      } else if (JSON.stringify(previous) !== JSON.stringify(record)) {
        operations.push({ resource, action: "update", record_id: recordId, values: record });
      }
    });
    previousById.forEach((_record, recordId) => {
      if (!nextById.has(recordId)) {
        operations.push({ resource, action: "delete", record_id: recordId });
      }
    });
  });
  return operations;
};

const applyOperation = (operation) => {
  if (operation.resource === "user") {
    return api.updateCrmProfile(operation.record_id, operation.values);
  }
  if (operation.resource === "following") {
    return operation.action === "create"
      ? api.followCrmProfile(operation.values.userId)
      : api.unfollowCrmProfile(operation.record_id);
  }
  if (operation.resource === "chatterPosts") {
    if (operation.action === "create_post") {
      return api.createChatterPost(operation.content);
    }
    if (operation.action === "like_post") {
      return api.likeChatterPost(operation.record_id);
    }
    if (operation.action === "unlike_post") {
      return api.unlikeChatterPost(operation.record_id);
    }
    return api.commentOnChatterPost(operation.record_id, operation.content);
  }
  if (operation.action === "create") {
    return api.createCrmRecord(operation.resource, operation.values);
  }
  if (operation.action === "update") {
    return api.updateCrmRecord(operation.resource, operation.record_id, operation.values);
  }
  return api.deleteCrmRecord(operation.resource, operation.record_id);
};

const hydrateResponse = (payload, setState, setMeta, setUserId) => {
  if (!payload) return;
  setUserId(payload.user_id || null);
  setMeta(payload.state?.meta || null);
  setState(payload.state?.data || null);
};

export const AppProvider = ({ children }) => {
  const [state, setState] = useState(null);
  const [meta, setMeta] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshState = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    setError("");
    try {
      const next = await api.getCrmWorkspace();
      hydrateResponse(next, setState, setMeta, setUserId);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load state.");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  const applyCrmChange = useCallback(
    async (partial) => {
      if (!partial || typeof partial !== "object") return null;
      setState((prev) => {
        if (!prev) return { ...partial };
        return { ...prev, ...partial };
      });
      setError("");
      try {
        const operations = buildOperations(state, partial);
        if (operations.length === 0) return state;
        let next = null;
        for (const operation of operations) {
          next = await applyOperation(operation);
        }
        hydrateResponse(next, setState, setMeta, setUserId);
        return next.state?.data || null;
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to update state.");
        await refreshState({ silent: true });
        throw err;
      }
    },
    [refreshState, state]
  );

  const convertLead = useCallback(async (leadId, conversion) => {
    setError("");
    try {
      const next = await api.convertCrmLead(leadId, conversion);
      hydrateResponse(next, setState, setMeta, setUserId);
      return next.state?.data || null;
    } catch (err) {
      setError(err.message || "Failed to convert lead.");
      throw err;
    }
  }, []);

  useEffect(() => {
    const redirected = applyCookieFromQuery();
    if (redirected) return;
    refreshState();
  }, [refreshState]);

  return (
    <AppContext.Provider
      value={{
        state,
        meta,
        userId,
        loading,
        error,
        refreshState,
        applyCrmChange,
        convertLead,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider.");
  }
  return context;
};
