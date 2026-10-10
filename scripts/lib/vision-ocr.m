#import <Foundation/Foundation.h>
#import <Vision/Vision.h>
int main(int argc,const char *argv[]) { @autoreleasepool {
 if(argc!=2)return 2;
 NSURL *url=[NSURL fileURLWithPath:[NSString stringWithUTF8String:argv[1]]];
 VNRecognizeTextRequest *request=[VNRecognizeTextRequest new];request.recognitionLevel=VNRequestTextRecognitionLevelAccurate;request.usesLanguageCorrection=NO;request.recognitionLanguages=@[@"en-US"];
 VNImageRequestHandler *handler=[[VNImageRequestHandler alloc] initWithURL:url options:@{}];NSError *error=nil;
 if(![handler performRequests:@[request] error:&error]){fprintf(stderr,"%s\n",error.localizedDescription.UTF8String);return 1;}
 NSMutableArray *rows=[NSMutableArray new];for(VNRecognizedTextObservation *o in request.results){VNRecognizedText *t=[[o topCandidates:1] firstObject];if(t)[rows addObject:@{@"text":t.string,@"confidence":@(t.confidence),@"x":@(o.boundingBox.origin.x),@"y":@(1-o.boundingBox.origin.y-o.boundingBox.size.height),@"width":@(o.boundingBox.size.width),@"height":@(o.boundingBox.size.height)}];}
 NSData *data=[NSJSONSerialization dataWithJSONObject:rows options:NSJSONWritingSortedKeys error:&error];if(!data)return 1;fwrite(data.bytes,1,data.length,stdout);return 0;
}}
