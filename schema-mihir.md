CREATE TABLE public.whatsapp\_portal\_contacts (

&#x20; id uuid NOT NULL DEFAULT extensions.uuid\_generate\_v4(),

&#x20; user\_id uuid NULL,

&#x20; phone\_number text NOT NULL,

&#x20; name text NULL,

&#x20; profile\_name text NULL,

&#x20; created\_at timestamp WITH TIME ZONE NULL DEFAULT now(),



&#x20; CONSTRAINT whatsapp\_portal\_contacts\_pkey

&#x20;   PRIMARY KEY (id),



&#x20; CONSTRAINT whatsapp\_portal\_contacts\_user\_id\_phone\_number\_key

&#x20;   UNIQUE (user\_id, phone\_number),



&#x20; CONSTRAINT whatsapp\_portal\_contacts\_user\_id\_fkey

&#x20;   FOREIGN KEY (user\_id)

&#x20;   REFERENCES auth.users (id)

&#x20;   ON DELETE CASCADE

) TABLESPACE pg\_default;



CREATE INDEX IF NOT EXISTS idx\_whatsapp\_portal\_contacts\_user\_id

ON public.whatsapp\_portal\_contacts

USING btree (user\_id)

TABLESPACE pg\_default;



CREATE TABLE public.whatsapp\_portal\_conversations (

&#x20; id uuid NOT NULL DEFAULT extensions.uuid\_generate\_v4(),

&#x20; user\_id uuid NULL,

&#x20; contact\_id uuid NULL,

&#x20; last\_message text NULL,

&#x20; last\_message\_at timestamp WITH TIME ZONE NULL,

&#x20; unread\_count integer NULL DEFAULT 0,

&#x20; created\_at timestamp WITH TIME ZONE NULL DEFAULT now(),



&#x20; CONSTRAINT whatsapp\_portal\_conversations\_pkey

&#x20;   PRIMARY KEY (id),



&#x20; CONSTRAINT whatsapp\_portal\_conversations\_user\_id\_contact\_id\_key

&#x20;   UNIQUE (user\_id, contact\_id),



&#x20; CONSTRAINT whatsapp\_portal\_conversations\_contact\_id\_fkey

&#x20;   FOREIGN KEY (contact\_id)

&#x20;   REFERENCES public.whatsapp\_portal\_contacts (id)

&#x20;   ON DELETE CASCADE,



&#x20; CONSTRAINT whatsapp\_portal\_conversations\_user\_id\_fkey

&#x20;   FOREIGN KEY (user\_id)

&#x20;   REFERENCES auth.users (id)

&#x20;   ON DELETE CASCADE

) TABLESPACE pg\_default;



CREATE INDEX IF NOT EXISTS idx\_whatsapp\_portal\_conversations\_user\_id

ON public.whatsapp\_portal\_conversations

USING btree (user\_id)

TABLESPACE pg\_default;





create view public.whatsapp\_portal\_debug\_inbox\_messages as

select

&#x20; m.id,

&#x20; m.content,

&#x20; m.direction,

&#x20; m.status,

&#x20; m.created\_at,

&#x20; c.id as conversation\_id,

&#x20; ct.phone\_number,

&#x20; ct.name

from

&#x20; messages m

&#x20; left join whatsapp\_portal\_conversations c on m.conversation\_id = c.id

&#x20; left join whatsapp\_portal\_contacts ct on c.contact\_id = ct.id

order by

&#x20; m.created\_at desc;



CREATE TABLE public.whatsapp\_portal\_messages (

&#x20; id uuid NOT NULL DEFAULT extensions.uuid\_generate\_v4(),

&#x20; user\_id uuid NULL,

&#x20; conversation\_id uuid NULL,

&#x20; wa\_message\_id text NULL,

&#x20; direction text NULL,

&#x20; content text NULL,

&#x20; message\_type text NULL DEFAULT 'text',

&#x20; status text NULL DEFAULT 'sent',

&#x20; delivered\_at timestamp WITH TIME ZONE NULL,

&#x20; seen\_at timestamp WITH TIME ZONE NULL,

&#x20; created\_at timestamp WITH TIME ZONE NULL DEFAULT now(),

&#x20; metadata jsonb NULL,

&#x20; template\_id uuid NULL,

&#x20; template\_name text NULL,

&#x20; pricing\_category text NULL,

&#x20; conversation\_category text NULL,

&#x20; media\_url text NULL,

&#x20; file\_name text NULL,

&#x20; mime\_type text NULL,

&#x20; file\_size bigint NULL,

&#x20; reactions jsonb NULL DEFAULT '\[]'::jsonb,

&#x20; media jsonb NULL DEFAULT '\[]'::jsonb,

&#x20; source text NULL DEFAULT 'internal',



&#x20; CONSTRAINT whatsapp\_portal\_messages\_pkey

&#x20;   PRIMARY KEY (id),



&#x20; CONSTRAINT whatsapp\_portal\_messages\_wa\_message\_id\_key

&#x20;   UNIQUE (wa\_message\_id),



&#x20; CONSTRAINT whatsapp\_portal\_messages\_conversation\_id\_fkey

&#x20;   FOREIGN KEY (conversation\_id)

&#x20;   REFERENCES public.whatsapp\_portal\_conversations (id)

&#x20;   ON DELETE CASCADE,



&#x20; CONSTRAINT whatsapp\_portal\_messages\_template\_id\_fkey

&#x20;   FOREIGN KEY (template\_id)

&#x20;   REFERENCES public.whatsapp\_templates (id),



&#x20; CONSTRAINT whatsapp\_portal\_messages\_user\_id\_fkey

&#x20;   FOREIGN KEY (user\_id)

&#x20;   REFERENCES auth.users (id)

&#x20;   ON DELETE CASCADE,



&#x20; CONSTRAINT whatsapp\_portal\_messages\_direction\_check

&#x20;   CHECK (

&#x20;     direction = ANY (

&#x20;       ARRAY\['inbound'::text, 'outbound'::text]

&#x20;     )

&#x20;   )

) TABLESPACE pg\_default;



CREATE INDEX IF NOT EXISTS idx\_whatsapp\_portal\_messages\_template\_id

ON public.whatsapp\_portal\_messages (template\_id);



CREATE INDEX IF NOT EXISTS idx\_whatsapp\_portal\_messages\_wa\_message\_id

ON public.whatsapp\_portal\_messages (wa\_message\_id);



CREATE INDEX IF NOT EXISTS idx\_whatsapp\_portal\_messages\_user\_id

ON public.whatsapp\_portal\_messages (user\_id);



CREATE INDEX IF NOT EXISTS idx\_whatsapp\_portal\_messages\_conversation\_id

ON public.whatsapp\_portal\_messages (conversation\_id);



CREATE INDEX IF NOT EXISTS idx\_whatsapp\_portal\_messages\_direction\_user

ON public.whatsapp\_portal\_messages (user\_id, direction, created\_at);



CREATE INDEX IF NOT EXISTS idx\_whatsapp\_portal\_messages\_template\_name\_ilike

ON public.whatsapp\_portal\_messages (lower(template\_name));





CREATE TABLE public.whatsapp\_portal\_configs (

&#x20; id uuid NOT NULL DEFAULT extensions.uuid\_generate\_v4(),

&#x20; user\_id uuid NULL,

&#x20; phone\_number\_id text NOT NULL,

&#x20; waba\_id text NOT NULL,

&#x20; access\_token text NOT NULL,

&#x20; webhook\_verify\_token text NOT NULL,

&#x20; is\_active boolean NULL DEFAULT true,

&#x20; created\_at timestamp WITH TIME ZONE NULL DEFAULT now(),



&#x20; CONSTRAINT whatsapp\_portal\_configs\_pkey

&#x20;   PRIMARY KEY (id),



&#x20; CONSTRAINT whatsapp\_portal\_configs\_user\_id\_key

&#x20;   UNIQUE (user\_id),



&#x20; CONSTRAINT whatsapp\_portal\_configs\_user\_id\_fkey

&#x20;   FOREIGN KEY (user\_id)

&#x20;   REFERENCES auth.users (id)

&#x20;   ON DELETE CASCADE

) TABLESPACE pg\_default;





CREATE TABLE public.whatsapp\_portal\_message\_events (

&#x20; id uuid NOT NULL DEFAULT extensions.uuid\_generate\_v4(),

&#x20; message\_id uuid NULL,

&#x20; wa\_message\_id text NULL,

&#x20; status text NULL,

&#x20; event\_time timestamp WITH TIME ZONE NULL,

&#x20; conversation\_id text NULL,

&#x20; billable boolean NULL,

&#x20; created\_at timestamp WITH TIME ZONE NULL DEFAULT now(),



&#x20; CONSTRAINT whatsapp\_portal\_message\_events\_pkey

&#x20;   PRIMARY KEY (id),



&#x20; CONSTRAINT whatsapp\_portal\_message\_events\_message\_id\_fkey

&#x20;   FOREIGN KEY (message\_id)

&#x20;   REFERENCES public.whatsapp\_portal\_messages (id)

) TABLESPACE pg\_default;



CREATE INDEX IF NOT EXISTS idx\_whatsapp\_portal\_message\_events\_wa\_message\_id

ON public.whatsapp\_portal\_message\_events (wa\_message\_id);



CREATE TABLE public.whatsapp\_portal\_pricing (

&#x20; id uuid NOT NULL DEFAULT extensions.uuid\_generate\_v4(),

&#x20; category text NULL,

&#x20; price\_per\_conversation numeric NULL,

&#x20; created\_at timestamp WITH TIME ZONE NULL DEFAULT now(),

&#x20; user\_id uuid NULL,



&#x20; CONSTRAINT whatsapp\_portal\_pricing\_pkey

&#x20;   PRIMARY KEY (id),



&#x20; CONSTRAINT whatsapp\_portal\_pricing\_user\_cat\_key

&#x20;   UNIQUE (user\_id, category),



&#x20; CONSTRAINT whatsapp\_portal\_pricing\_user\_id\_fkey

&#x20;   FOREIGN KEY (user\_id)

&#x20;   REFERENCES auth.users (id)

&#x20;   ON DELETE CASCADE

) TABLESPACE pg\_default;





CREATE TABLE public.whatsapp\_portal\_template\_stats (

&#x20; id uuid NOT NULL DEFAULT extensions.uuid\_generate\_v4(),

&#x20; template\_id uuid NULL,

&#x20; user\_id uuid NULL,

&#x20; sent\_count integer NULL DEFAULT 0,

&#x20; delivered\_count integer NULL DEFAULT 0,

&#x20; read\_count integer NULL DEFAULT 0,

&#x20; failed\_count integer NULL DEFAULT 0,

&#x20; replied\_count integer NULL DEFAULT 0,

&#x20; total\_cost numeric NULL DEFAULT 0,

&#x20; updated\_at timestamp WITH TIME ZONE NULL DEFAULT now(),



&#x20; CONSTRAINT whatsapp\_portal\_template\_stats\_pkey

&#x20;   PRIMARY KEY (id),



&#x20; CONSTRAINT whatsapp\_portal\_template\_stats\_user\_template\_unique

&#x20;   UNIQUE (user\_id, template\_id),



&#x20; CONSTRAINT whatsapp\_portal\_template\_stats\_template\_id\_fkey

&#x20;   FOREIGN KEY (template\_id)

&#x20;   REFERENCES public.whatsapp\_templates (id)

) TABLESPACE pg\_default;



CREATE INDEX IF NOT EXISTS idx\_whatsapp\_portal\_template\_stats\_template

ON public.whatsapp\_portal\_template\_stats (template\_id);



CREATE INDEX IF NOT EXISTS idx\_whatsapp\_portal\_template\_stats\_lookup

ON public.whatsapp\_portal\_template\_stats (template\_id, user\_id);





CREATE TABLE public.whatsapp\_portal\_templates (

&#x20; id uuid NOT NULL DEFAULT extensions.uuid\_generate\_v4(),

&#x20; user\_id uuid NULL,

&#x20; template\_name text NOT NULL,

&#x20; category text NULL,

&#x20; language text NULL,

&#x20; status text NULL,

&#x20; created\_at timestamp WITH TIME ZONE NULL DEFAULT now(),

&#x20; body text NULL,

&#x20; header text NULL,



&#x20; CONSTRAINT whatsapp\_portal\_templates\_pkey

&#x20;   PRIMARY KEY (id),



&#x20; CONSTRAINT whatsapp\_portal\_templates\_user\_template\_unique

&#x20;   UNIQUE (user\_id, template\_name),



&#x20; CONSTRAINT whatsapp\_portal\_templates\_user\_id\_fkey

&#x20;   FOREIGN KEY (user\_id)

&#x20;   REFERENCES auth.users (id)

) TABLESPACE pg\_default;







CREATE OR REPLACE VIEW public.debug\_inbox\_messages AS

SELECT

&#x20; m.id,

&#x20; m.content,

&#x20; m.direction,

&#x20; m.status,

&#x20; m.created\_at,

&#x20; c.id AS conversation\_id,

&#x20; ct.phone\_number,

&#x20; ct.name

FROM public.whatsapp\_portal\_messages m

LEFT JOIN public.whatsapp\_portal\_conversations c

&#x20; ON m.conversation\_id = c.id

LEFT JOIN public.whatsapp\_portal\_contacts ct

&#x20; ON c.contact\_id = ct.id

ORDER BY m.created\_at DESC;





CREATE OR REPLACE VIEW public.responses AS

SELECT

&#x20; m.created\_at AS "timestamp",



&#x20; CASE

&#x20;   WHEN m.direction = 'inbound' THEN 'INCOMING\_MSG'

&#x20;   WHEN m.source = 'portal' THEN 'PORTAL\_REPLY'

&#x20;   ELSE 'STATUS\_UPDATE'

&#x20; END AS event\_type,



&#x20; m.wa\_message\_id AS message\_id,



&#x20; c.phone\_number AS from\_number,

&#x20; COALESCE(c.name, c.profile\_name) AS from\_name,



&#x20; wc.phone\_number\_id AS to\_number,



&#x20; COALESCE(

&#x20;   (

&#x20;     SELECT UPPER(wme.status)

&#x20;     FROM public.whatsapp\_portal\_message\_events wme

&#x20;     WHERE wme.message\_id = m.id

&#x20;     ORDER BY wme.event\_time DESC

&#x20;     LIMIT 1

&#x20;   ),

&#x20;   UPPER(m.status)

&#x20; ) AS status,



&#x20; m.message\_type,

&#x20; m.content,



&#x20; NULL::text AS media\_id,

&#x20; m.mime\_type AS media\_type,

&#x20; m.media\_url,



&#x20; wc.phone\_number\_id AS business\_phone,

&#x20; wc.phone\_number\_id,



&#x20; conv.id::text AS conversation\_id,



&#x20; m.pricing\_category,



&#x20; NULL::text AS error\_code,

&#x20; NULL::text AS error\_message,

&#x20; NULL::text AS context\_message\_id,

&#x20; NULL::text AS interactive\_type,

&#x20; NULL::text AS interactive\_id,

&#x20; NULL::text AS interactive\_title,

&#x20; NULL::text AS referred\_product,



&#x20; CONCAT(

&#x20;   'TemplateName:',

&#x20;   COALESCE(wt.template\_name, 'Unknown')

&#x20; ) AS raw\_payload



FROM public.whatsapp\_portal\_messages m



LEFT JOIN public.whatsapp\_portal\_conversations conv

&#x20; ON conv.id = m.conversation\_id



LEFT JOIN public.whatsapp\_portal\_contacts c

&#x20; ON c.id = conv.contact\_id



LEFT JOIN public.whatsapp\_portal\_templates wt

&#x20; ON wt.id = m.template\_id



LEFT JOIN public.whatsapp\_portal\_configs wc

&#x20; ON wc.user\_id = m.user\_id;

