#get cammand line args. Contains filename for reading and filename for writing
#args = commandArgs(trailingOnly = TRUE)

#load the igraph library
#suppressMessages(library("igraph"))

#File for reading edges from
#edgesFile <-args[1]

#file for writing graph coordinates into
#writeFile <- args[2]


#myTable <- read.table(edgesFile)

#xlist <- graph.data.frame(myTable)


#l <- layout_with_kk(xlist)


#write(l, file = writeFile,
#      ncolumns = 2,
#      append = FALSE, sep = " ")


suppressMessages(library("igraph"))


ref <- read.csv('edges.csv', as.is=T,header=FALSE)
el <- graph.data.frame(ref, directed=F)
lay.kk <- layout.kamada.kawai(el)

#plot.igraph(el, lay=lay.kk, vertex.label=NA, vertex.size=2, vertex.color="black")
lay.kk
writeFile <- "foo.txt"
#write(lay.kk, file = writeFile,
#      ncolumns = 2,
#      append = FALSE, sep = ",")


write.table(lay.kk,
             writeFile,
             append=F,
             sep=" ", )
