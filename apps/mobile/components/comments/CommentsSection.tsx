import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { apiFetch } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { theme } from "@/lib/theme";

type Comment = {
  _id: string;
  text?: string;
  createdAt?: string;
  author?: { name?: string; username?: string };
  replies?: Comment[];
};

export function CommentsSection({ startupId }: { startupId: string }) {
  const { user, signIn } = useAuth();
  const [text, setText] = useState("");
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["comments", startupId],
    queryFn: () =>
      apiFetch<{ comments: Comment[] }>(
        `/api/comments?startupId=${startupId}`,
      ),
  });

  const postMutation = useMutation({
    mutationFn: () =>
      apiFetch("/api/comments", {
        method: "POST",
        body: JSON.stringify({
          action: "create",
          startupId,
          text,
        }),
      }),
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["comments", startupId] });
    },
  });

  const comments = data?.comments ?? [];

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Comments</Text>

      {isLoading ? (
        <ActivityIndicator color={theme.primary} style={styles.loader} />
      ) : comments.length === 0 ? (
        <Text style={styles.empty}>No comments yet. Be the first!</Text>
      ) : (
        comments.map((c) => <CommentItem key={c._id} comment={c} />)
      )}

      {user ? (
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Write a comment..."
            placeholderTextColor={theme.gray500}
            value={text}
            onChangeText={setText}
            multiline
          />
          <Pressable
            style={[styles.postBtn, !text.trim() && styles.postBtnDisabled]}
            onPress={() => postMutation.mutate()}
            disabled={!text.trim() || postMutation.isPending}
          >
            <Text style={styles.postText}>
              {postMutation.isPending ? "Posting..." : "Post"}
            </Text>
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={signIn} style={styles.loginBtn}>
          <Text style={styles.loginText}>Log in to comment</Text>
        </Pressable>
      )}
    </View>
  );
}

function CommentItem({ comment, depth = 0 }: { comment: Comment; depth?: number }) {
  return (
    <View style={[styles.comment, { marginLeft: depth * 16 }]}>
      <Text style={styles.author}>
        {comment.author?.name || comment.author?.username || "Anonymous"}
      </Text>
      <Text style={styles.body}>{comment.text}</Text>
      {comment.replies?.map((r) => (
        <CommentItem key={r._id} comment={r} depth={depth + 1} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 40 },
  title: {
    fontFamily: theme.fontFamily.bold,
    fontSize: 30,
    color: theme.black,
    marginBottom: 16,
  },
  loader: { marginVertical: 16 },
  empty: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    color: theme.gray500,
    marginBottom: 16,
  },
  comment: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: theme.gray100,
  },
  author: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 14,
    color: theme.black,
    marginBottom: 4,
  },
  body: {
    fontFamily: theme.fontFamily.regular,
    fontSize: 14,
    color: theme.black100,
    lineHeight: 20,
  },
  form: { marginTop: 16, gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: theme.gray200,
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    fontFamily: theme.fontFamily.regular,
    fontSize: 16,
    textAlignVertical: "top",
  },
  postBtn: {
    alignSelf: "flex-end",
    backgroundColor: theme.primary,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  postBtnDisabled: { opacity: 0.5 },
  postText: {
    fontFamily: theme.fontFamily.semiBold,
    fontSize: 14,
    color: theme.white,
  },
  loginBtn: {
    marginTop: 16,
    padding: 12,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: theme.gray100,
  },
  loginText: {
    fontFamily: theme.fontFamily.medium,
    fontSize: 14,
    color: theme.primary,
  },
});
