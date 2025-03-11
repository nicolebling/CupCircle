import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userSchema } from "@/models/Schema";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
// ... rest of the imports

// ... other code ...

const form = useForm({
  resolver: zodResolver(userSchema),
  // ... other form options ...
});

// ... rest of the component code ...