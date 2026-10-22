// Read-only PDFKit renderer. No PDF writing or mutation.
#import <Cocoa/Cocoa.h>
#import <PDFKit/PDFKit.h>
int main(int argc,const char *argv[]) {
 @autoreleasepool {
  if(argc!=3) return 2;
  NSData *data=[NSData dataWithContentsOfFile:@(argv[1])];
  NSArray *jobs=[NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
  for(NSDictionary *job in jobs){
   PDFDocument *doc=[[PDFDocument alloc] initWithURL:[NSURL fileURLWithPath:job[@"path"]]];
   for(NSNumber *n in job[@"pages"]){
    PDFPage *page=[doc pageAtIndex:n.unsignedIntegerValue-1];
    NSImage *image=[page thumbnailOfSize:NSMakeSize(3200,4500) forBox:kPDFDisplayBoxMediaBox];
    NSBitmapImageRep *bitmap=[NSBitmapImageRep imageRepWithData:image.TIFFRepresentation];
    NSData *png=[bitmap representationUsingType:NSBitmapImageFileTypePNG properties:@{}];
    NSString *name=[NSString stringWithFormat:@"%@-p%@.png",job[@"id"],n];
    if(![png writeToFile:[@(argv[2]) stringByAppendingPathComponent:name] atomically:YES]) return 3;
    puts(name.UTF8String);
   }
  }
 }
 return 0;
}
