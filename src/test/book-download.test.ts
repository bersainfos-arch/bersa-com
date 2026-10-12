import { beforeEach, expect, it, vi } from "vitest";
const client=vi.hoisted(()=>({rpc:vi.fn(),from:vi.fn(),storage:{from:vi.fn()}}));
vi.mock("@/integrations/supabase/client",()=>({supabase:client}));
import { downloadBook } from "@/lib/books";
beforeEach(()=>vi.resetAllMocks());
it("never reads a file or signs a URL before verified access",async()=>{
 client.rpc.mockResolvedValue({data:false,error:null});
 await expect(downloadBook("paid-book")).rejects.toThrow("paiement vérifié");
 expect(client.rpc).toHaveBeenCalledWith("can_access_book",{_book:"paid-book"});
 expect(client.from).not.toHaveBeenCalled();expect(client.storage.from).not.toHaveBeenCalled();
});
it("blocks a download when authorization fails",async()=>{
 client.rpc.mockResolvedValue({data:null,error:{message:"Access denied"}});
 await expect(downloadBook("paid-book")).rejects.toThrow();expect(client.storage.from).not.toHaveBeenCalled();
});
it("signs the authorized file for only sixty seconds",async()=>{
 client.rpc.mockResolvedValue({data:true,error:null});
 const single=vi.fn().mockResolvedValue({data:{file_path:"private/book.pdf"}});
 client.from.mockReturnValue({select:vi.fn().mockReturnValue({eq:vi.fn().mockReturnValue({single})})});
 const sign=vi.fn().mockResolvedValue({data:{signedUrl:"https://example.test/verified-file"},error:null});client.storage.from.mockReturnValue({createSignedUrl:sign});
 const click=vi.spyOn(HTMLAnchorElement.prototype,"click").mockImplementation(()=>{});
 await downloadBook("paid-book");expect(sign).toHaveBeenCalledWith("private/book.pdf",60,{download:true});expect(click).toHaveBeenCalledOnce();click.mockRestore();
});