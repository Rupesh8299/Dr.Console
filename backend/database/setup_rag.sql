
-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table to store your documents
create table if not exists medical_docs (
  id bigserial primary key,
  content text,
  metadata jsonb,
  embedding vector(768) -- Gemini Embedding-001 output dimension
);

-- Create a function to search for documents
create or replace function match_medical_docs (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    medical_docs.id,
    medical_docs.content,
    medical_docs.metadata,
    1 - (medical_docs.embedding <=> query_embedding) as similarity
  from medical_docs
  where 1 - (medical_docs.embedding <=> query_embedding) > match_threshold
  order by medical_docs.embedding <=> query_embedding
  limit match_count;
end;
$$;
