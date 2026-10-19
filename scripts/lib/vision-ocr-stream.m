#import <Foundation/Foundation.h>
#import <Vision/Vision.h>
#include <stdio.h>
int main(void){@autoreleasepool{
 VNRecognizeTextRequest *request=[VNRecognizeTextRequest new];request.recognitionLevel=VNRequestTextRecognitionLevelAccurate;request.usesLanguageCorrection=NO;request.recognitionLanguages=@[@"en-US"];
 char *line=NULL;size_t cap=0;
 while(getline(&line,&cap,stdin)>0){@autoreleasepool{
 NSString *path=[[NSString stringWithUTF8String:line] stringByTrimmingCharactersInSet:[NSCharacterSet newlineCharacterSet]];
 VNImageRequestHandler *handler=[[VNImageRequestHandler alloc] initWithURL:[NSURL fileURLWithPath:path] options:@{}];NSError *error=nil;
 if(![handler performRequests:@[request] error:&error]){fprintf(stderr,"%s\n",error.localizedDescription.UTF8String);return 1;}
 NSMutableArray *rows=[NSMutableArray new];for(VNRecognizedTextObservation *o in request.results){VNRecognizedText *t=[[o topCandidates:1] firstObject];if(t)[rows addObject:@{@"text":t.string,@"confidence":@(t.confidence),@"x":@(o.boundingBox.origin.x),@"y":@(1-o.boundingBox.origin.y-o.boundingBox.size.height),@"width":@(o.boundingBox.size.width),@"height":@(o.boundingBox.size.height)}];}
 NSData *data=[NSJSONSerialization dataWithJSONObject:rows options:NSJSONWritingSortedKeys error:&error];if(!data)return 1;fwrite(data.bytes,1,data.length,stdout);fputc('\n',stdout);fflush(stdout);
 }}free(line);
}return 0;}
